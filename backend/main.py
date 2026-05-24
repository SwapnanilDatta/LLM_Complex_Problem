"""
MathProof Agent — FastAPI + LangGraph backend entry point
"""
from __future__ import annotations

import asyncio
import json
import time
import traceback
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from db.mongo import connect_db, close_db, save_run
from agent.graph import build_graph, _snippet

load_dotenv()

@asynccontextmanager
async def lifespan(app):
    # Establish connection to MongoDB on startup
    await connect_db()
    yield
    # Close connection on shutdown
    await close_db()

app = FastAPI(title="MathProof Agent API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ── Schemas ─────────────────────────────────────────────────────────────────
class ProofRequest(BaseModel):
    problem: str
    max_iterations: int = 8
    required_passes: int = 1

# ── Streaming helper ────────────────────────────────────────────────────────
async def run_graph(graph, request: ProofRequest, queue: asyncio.Queue):
    initial_state = {
        "problem": request.problem,
        "subgoals": "",
        "current_proof": "",
        "summary": "",
        "feedback": "",
        "sympy_feedback": "",
        "iteration": 0,
        "consecutive_passes": 0,
        "max_iterations": request.max_iterations,
        "required_passes": request.required_passes,
        "status": "running",
        "history": [],
    }

    run_id = f"run_{int(time.time() * 1000)}"
    await queue.put({"type": "start", "payload": {"run_id": run_id, "problem": request.problem}})

    try:
        current = dict(initial_state)

        async for chunk in graph.astream(initial_state, stream_mode="updates"):
            for node_name, update in chunk.items():
                for k, v in update.items():
                    if k == "history":
                        current["history"] = current.get("history", []) + v
                    else:
                        current[k] = v

                await queue.put({
                    "type": "node_update",
                    "payload": {
                        "node": node_name,
                        "iteration": current["iteration"],
                        "consecutive_passes": current["consecutive_passes"],
                        "status": current["status"],
                        "proof_snippet": _snippet(current["current_proof"]),
                        "feedback": current["feedback"],
                        "sympy_feedback": current.get("sympy_feedback", ""),
                        "subgoals": current.get("subgoals", ""),
                        "full_update": update,
                    },
                })

        # Save results to MongoDB
        await save_run({
            "run_id": run_id,
            "problem": request.problem,
            "final_proof": current["current_proof"],
            "iterations": current["iteration"],
            "status": current["status"],
            "history": current["history"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        await queue.put({
            "type": "done",
            "payload": {
                "run_id": run_id,
                "status": current["status"],
                "final_proof": current["current_proof"],
                "summary": current.get("summary", ""),
            },
        })

    except Exception as exc:
        await queue.put({
            "type": "error",
            "payload": {"message": str(exc), "traceback": traceback.format_exc()},
        })

@app.post("/api/prove/stream")
async def prove_stream(request: ProofRequest, req: Request):
    graph = build_graph()
    queue: asyncio.Queue = asyncio.Queue()

    async def event_generator() -> AsyncGenerator:
        task = asyncio.create_task(run_graph(graph, request, queue))
        while True:
            if await req.is_disconnected():
                task.cancel()
                break
            try:
                event = await asyncio.wait_for(queue.get(), timeout=120)
                yield {"event": event["type"], "data": json.dumps(event["payload"])}
                if event["type"] in ("done", "error"):
                    break
            except asyncio.TimeoutError:
                yield {"event": "error", "data": json.dumps({"message": "Timeout after 120s"})}
                break

    return EventSourceResponse(event_generator())

@app.get("/api/health")
async def health():
    import sympy
    return {"status": "ok", "sympy_version": sympy.__version__}