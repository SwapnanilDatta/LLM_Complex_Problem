import json
import asyncio
import time
import traceback
from typing import AsyncGenerator
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from models.schemas import SolveRequest
from services.pipeline import build_pipeline
from models.response import UniversalResponse, StepOutput, ResponseMetadata

router = APIRouter()
pipeline = build_pipeline()

async def run_pipeline_stream(request: SolveRequest, queue: asyncio.Queue, domain: str):
    start_time = time.time()
    run_id = f"run_{int(start_time * 1000)}"
    
    await queue.put({
        "type": "start",
        "payload": {"run_id": run_id, "problem": request.problem}
    })
    
    initial_state = {
        "query": request.problem,
        "force_mode": domain,
        "domain": domain,
        "history": [],
        "attachments": [attachment.model_dump() for attachment in request.attachments] if request.attachments else []
    }
    
    current = dict(initial_state)
    steps = []
    
    try:
        async for chunk in pipeline.astream(initial_state, stream_mode="updates"):
            for node_name, update in chunk.items():
                # Merge state
                for k, v in update.items():
                    if k == "history":
                        current["history"] = current.get("history", []) + v
                    else:
                        current[k] = v
                        
                # Create a generic step output for this node
                step = StepOutput(
                    title=node_name.capitalize(),
                    content=str(update),
                    is_verified=current.get("verified", False) if node_name == "verifier" else False
                )
                steps.append(step)
                
                # Stream the update
                # We map the new pipeline state to the frontend's expected format
                # while also sending the new Universal fields if the frontend wants them.
                await queue.put({
                    "type": "node_update",
                    "payload": {
                        "node": node_name,
                        "status": current.get("status", "running"),
                        "mode": current.get("domain", ""),
                        "code_snippet": current.get("structured_problem", ""),
                        "execution_result": str(current.get("solver_output", "")),
                        "critic_feedback": current.get("verification_feedback", ""),
                        "current_proof": current.get("explanation", ""),
                        "full_update": update
                    }
                })
        
        # Build Final Universal Response
        exec_time = int((time.time() - start_time) * 1000)
        final_response = UniversalResponse(
            domain=current.get("domain", "unknown"),
            steps=steps,
            final_answer=current.get("final_answer", current.get("verification_feedback", "Failed")),
            verified=current.get("verified", False),
            visualization=current.get("visualization"),
            metadata=ResponseMetadata(execution_time_ms=exec_time, engine_used=current.get("domain", "unknown"))
        )
        
        await queue.put({
            "type": "done",
            "payload": {
                "run_id": run_id,
                "status": current.get("status", "completed"),
                "final_answer": final_response.final_answer,
                "universal_response": final_response.model_dump()
            }
        })
        
    except Exception as exc:
        await queue.put({
            "type": "error",
            "payload": {"message": str(exc), "traceback": traceback.format_exc()}
        })

@router.post("/api/maths/solve")
@router.post("/api/solve/stream") # Support both old and new paths
async def solve_stream_math(request: SolveRequest, req: Request):
    return _build_event_source(request, req, "maths")

@router.post("/api/automata/stream")
async def solve_stream_automata(request: SolveRequest, req: Request):
    return _build_event_source(request, req, "automata")

@router.post("/api/ml/stream")
async def solve_stream_ml(request: SolveRequest, req: Request):
    return _build_event_source(request, req, "ml")

def _build_event_source(request: SolveRequest, req: Request, domain: str):
    queue: asyncio.Queue = asyncio.Queue()

    async def event_generator() -> AsyncGenerator:
        task = asyncio.create_task(run_pipeline_stream(request, queue, domain))
        while True:
            if await req.is_disconnected():
                task.cancel()
                break
            try:
                event = await asyncio.wait_for(queue.get(), timeout=300)
                yield {"event": event["type"], "data": json.dumps(event["payload"])}
                if event["type"] in ("done", "error"):
                    break
            except asyncio.TimeoutError:
                yield {"event": "error", "data": json.dumps({"message": "Timeout after 300s"})}
                break

    return EventSourceResponse(event_generator())

@router.get("/api/health")
async def health():
    return {"status": "ok", "pipeline": "strict-linear"}
