"""
eval_harness.py
Runs 3 ablation conditions on your existing graph.py:

  Condition A — full_pipeline   : your full graph (decomposer→generator→sympy→verifier loop)
  Condition B — no_sympy        : decomposer→generator→verifier (no SymPy node)
  Condition C — raw_groq        : single generator call, no verification, no loop

Usage examples:
  # Quick smoke test (6 problems, 2 conditions)
  python eval_harness.py --tiers algebra --conditions full_pipeline no_sympy --max-iter 3

  # Full run
  python eval_harness.py --all --max-iter 4 --sleep 2 --output eval_results.json

  # Specific problems only
  python eval_harness.py --ids alg_01 alg_02 nt_01 --conditions full_pipeline raw_groq
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import random
import sys
import time
import traceback
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

# ── Rate-limit-aware LLM wrapper ─────────────────────────────────────────────
async def _invoke_with_backoff(llm, messages, max_retries: int = 6):
    """Exponential backoff on 429 rate-limit errors."""
    for attempt in range(max_retries):
        try:
            return await llm.ainvoke(messages)
        except Exception as e:
            msg = str(e).lower()
            if "429" in msg or "rate_limit" in msg or "rate limit" in msg:
                wait = (2 ** attempt) + random.uniform(0.5, 1.5)
                print(f"  [rate limit] waiting {wait:.1f}s (attempt {attempt+1}/{max_retries})")
                await asyncio.sleep(wait)
            else:
                raise
    raise RuntimeError(f"Rate limit: max retries ({max_retries}) exceeded")

# ── Result dataclass ──────────────────────────────────────────────────────────
@dataclass
class ProblemResult:
    problem_id:         str
    tier:               str
    condition:          str
    status:             str           # "verified" | "failed" | "timeout" | "error"
    iterations:         int
    converged:          bool
    sympy_intercepts:   int           # errors caught by SymPy before LLM verifier
    llm_verifier_fails: int           # times LLM verifier said FAIL
    elapsed_seconds:    float = 0.0
    error_message:      str   = ""
    proof_length:       int   = 0
    raw_proof:          str   = ""    # stored for manual review

@dataclass
class EvalRun:
    run_id:     str
    timestamp:  str
    conditions: list[str]
    tiers:      list[str]
    results:    list[ProblemResult] = field(default_factory=list)

    def summary(self) -> dict:
        from collections import defaultdict
        groups = defaultdict(list)
        for r in self.results:
            groups[(r.condition, r.tier)].append(r)

        rows = []
        for (condition, tier), rs in sorted(groups.items()):
            n = len(rs)
            conv = sum(r.converged for r in rs)
            rows.append({
                "condition": condition,
                "tier": tier,
                "n_problems": n,
                "convergence_rate": round(conv / n, 3) if n else 0,
                "mean_iterations": round(sum(r.iterations for r in rs) / n, 2) if n else 0,
                "total_sympy_intercepts": sum(r.sympy_intercepts for r in rs),
                "total_llm_verifier_fails": sum(r.llm_verifier_fails for r in rs),
                "mean_elapsed_s": round(sum(r.elapsed_seconds for r in rs) / n, 1) if n else 0,
            })
        return {"rows": rows}

# ── Graph builders for each condition ────────────────────────────────────────
def _build_full_pipeline():
    """Your existing graph exactly as-is."""
    sys.path.insert(0, os.path.dirname(__file__))
    from agent.graph import build_graph
    return build_graph()

def _build_no_sympy():
    """
    Same as full pipeline but SymPy node is bypassed.
    Decomposer → Generator → Verifier (no SymPy check).
    """
    sys.path.insert(0, os.path.dirname(__file__))
    from agent.graph import (ProofState, decomposer_node, generator_node,
                       verifier_node, route_after_verifier)
    from langgraph.graph import END, StateGraph

    # Patch verifier to never see "sympy_failed" status
    async def verifier_no_sympy(state):
        # Force status to "running" so verifier always does LLM check
        patched = dict(state)
        patched["status"] = "running"
        return await verifier_node(patched)

    builder = StateGraph(ProofState)
    builder.add_node("decomposer", decomposer_node)
    builder.add_node("generator", generator_node)
    builder.add_node("verifier", verifier_no_sympy)
    builder.set_entry_point("decomposer")
    builder.add_edge("decomposer", "generator")
    builder.add_edge("generator", "verifier")
    builder.add_conditional_edges("verifier", route_after_verifier)
    return builder.compile()

def _build_raw_groq():
    """
    Single generator call. No decomposer, no SymPy, no verifier loop.
    Just: Generator → done.
    This represents baseline 'raw LLM' performance.
    """
    sys.path.insert(0, os.path.dirname(__file__))
    from agent.graph import ProofState, _llm_gen, _extract_tag, GENERATOR_SYSTEM
    from langchain_core.messages import HumanMessage, SystemMessage
    from langgraph.graph import END, StateGraph

    async def raw_generator(state: ProofState) -> dict:
        llm = _llm_gen()
        messages = [
            SystemMessage(content=GENERATOR_SYSTEM),
            HumanMessage(content=f"## Problem\n\n{state['problem']}\n"),
        ]
        response = await _invoke_with_backoff(llm, messages)
        raw = response.content
        proof = _extract_tag(raw, "proof") or raw
        summary = _extract_tag(raw, "summary") or ""
        return {
            "current_proof": proof,
            "summary": summary,
            "iteration": 1,
            "status": "verified",   # treat single pass as "done"
            "history": [{
                "iteration": 1,
                "proof": proof,
                "summary": summary,
                "feedback": "Raw single-pass — no verification.",
                "sympy_feedback": "",
                "verdict": "UNVERIFIED",
            }],
        }

    builder = StateGraph(ProofState)
    builder.add_node("generator", raw_generator)
    builder.set_entry_point("generator")
    builder.add_edge("generator", END)
    return builder.compile()

BUILDERS = {
    "full_pipeline": _build_full_pipeline,
    "no_sympy":      _build_no_sympy,
    "raw_groq":      _build_raw_groq,
}

# ── Single problem evaluator ──────────────────────────────────────────────────
async def evaluate_one(
    problem: dict,
    condition: str,
    max_iterations: int = 4,
    timeout: float = 200.0,
    sleep_between: float = 2.0,
) -> ProblemResult:
    start = time.monotonic()

    try:
        graph = BUILDERS[condition]()
    except Exception as e:
        return ProblemResult(
            problem_id=problem["id"], tier=problem["tier"], condition=condition,
            status="error", iterations=0, converged=False,
            sympy_intercepts=0, llm_verifier_fails=0,
            error_message=f"Graph build error: {e}",
        )

    initial_state = {
        "problem": problem["problem"],
        "subgoals": "",
        "current_proof": "",
        "summary": "",
        "feedback": "",
        "sympy_feedback": "",
        "iteration": 0,
        "consecutive_passes": 0,
        "max_iterations": max_iterations,
        "required_passes": 1,
        "status": "running",
        "history": [],
    }

    current = dict(initial_state)
    sympy_intercepts = 0
    llm_fails = 0

    try:
        async def _run():
            nonlocal sympy_intercepts, llm_fails, current
            async for chunk in graph.astream(initial_state, stream_mode="updates"):
                for node_name, update in chunk.items():
                    for k, v in update.items():
                        if k == "history":
                            current["history"] = current.get("history", []) + v
                        else:
                            current[k] = v

                    if node_name == "sympy_checker" and update.get("status") == "sympy_failed":
                        sympy_intercepts += 1

                    if node_name == "verifier":
                        for h in update.get("history", []):
                            if h.get("verdict") == "FAIL":
                                llm_fails += 1

        await asyncio.wait_for(_run(), timeout=timeout)

    except asyncio.TimeoutError:
        return ProblemResult(
            problem_id=problem["id"], tier=problem["tier"], condition=condition,
            status="timeout", iterations=current.get("iteration", 0),
            converged=False, sympy_intercepts=sympy_intercepts,
            llm_verifier_fails=llm_fails,
            elapsed_seconds=round(time.monotonic() - start, 2),
        )
    except Exception as exc:
        return ProblemResult(
            problem_id=problem["id"], tier=problem["tier"], condition=condition,
            status="error", iterations=current.get("iteration", 0),
            converged=False, sympy_intercepts=sympy_intercepts,
            llm_verifier_fails=llm_fails,
            error_message=str(exc)[:300],
            elapsed_seconds=round(time.monotonic() - start, 2),
        )

    # Pause between problems to respect rate limits
    await asyncio.sleep(sleep_between)

    status = current.get("status", "failed")
    # raw_groq is always "verified" (unverified pass) — mark separately
    if condition == "raw_groq":
        converged = True   # counted as "produced output"
    else:
        converged = status == "verified"

    return ProblemResult(
        problem_id=problem["id"],
        tier=problem["tier"],
        condition=condition,
        status=status,
        iterations=current.get("iteration", 0),
        converged=converged,
        sympy_intercepts=sympy_intercepts,
        llm_verifier_fails=llm_fails,
        elapsed_seconds=round(time.monotonic() - start, 2),
        proof_length=len(current.get("current_proof", "")),
        raw_proof=current.get("current_proof", "")[:500],  # first 500 chars for review
    )

# ── Main eval loop ─────────────────────────────────────────────────────────────
async def run_eval(
    problems: list[dict],
    conditions: list[str],
    max_iterations: int,
    sleep_between: float,
    output_path: str,
) -> EvalRun:

    run = EvalRun(
        run_id=f"eval_{int(time.time())}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        conditions=conditions,
        tiers=list({p["tier"] for p in problems}),
    )

    total = len(problems) * len(conditions)
    done = 0

    # Run sequentially to respect rate limits — never parallel on free tier
    for condition in conditions:
        print(f"\n── Condition: {condition} ({'  '.join(['─']*40)})")
        for problem in problems:
            result = await evaluate_one(
                problem, condition,
                max_iterations=max_iterations,
                sleep_between=sleep_between,
            )
            run.results.append(result)
            done += 1

            icon = "✓" if result.converged else ("⚠" if result.status == "timeout" else "✗")
            print(
                f"  [{done:>3}/{total}] {icon} {result.problem_id:<12} "
                f"status={result.status:<10} iters={result.iterations} "
                f"sympy={result.sympy_intercepts} llmfail={result.llm_verifier_fails} "
                f"t={result.elapsed_seconds}s"
            )
            _save(run, output_path)   # save after every result

    print(f"\nSaved → {output_path}")
    _print_summary(run)
    return run


def _save(run: EvalRun, path: str):
    out = {
        "run_id": run.run_id,
        "timestamp": run.timestamp,
        "conditions": run.conditions,
        "tiers": run.tiers,
        "results": [asdict(r) for r in run.results],
        "summary": run.summary(),
    }
    with open(path, "w") as f:
        json.dump(out, f, indent=2)


def _print_summary(run: EvalRun):
    s = run.summary()
    print("\n── Summary ──────────────────────────────────────────────────────────")
    header = f"{'Condition':<18} {'Tier':<15} {'N':>4} {'Conv%':>7} {'AvgIter':>8} {'SymPy↑':>7} {'LLMFail':>8}"
    print(header)
    print("─" * 70)
    for row in s["rows"]:
        print(
            f"{row['condition']:<18} {row['tier']:<15} {row['n_problems']:>4} "
            f"{row['convergence_rate']*100:>6.0f}% {row['mean_iterations']:>8.1f} "
            f"{row['total_sympy_intercepts']:>7} {row['total_llm_verifier_fails']:>8}"
        )

# ── CLI ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true", help="Run all 30 problems × 3 conditions")
    parser.add_argument("--tiers", nargs="+",
                        choices=["algebra", "number_theory", "olympiad"],
                        default=["algebra"])
    parser.add_argument("--conditions", nargs="+",
                        choices=["full_pipeline", "no_sympy", "raw_groq"],
                        default=["full_pipeline", "no_sympy", "raw_groq"])
    parser.add_argument("--ids", nargs="+", help="Run specific problem IDs")
    parser.add_argument("--max-iter", type=int, default=4)
    parser.add_argument("--sleep", type=float, default=2.0,
                        help="Seconds to sleep between API calls (default 2.0)")
    parser.add_argument("--output", default="eval_results.json")
    args = parser.parse_args()

    from benchmark_suite import BENCHMARK
    if args.ids:
        problems = [p for p in BENCHMARK if p["id"] in args.ids]
    elif args.all:
        problems = BENCHMARK
        args.conditions = ["full_pipeline", "no_sympy", "raw_groq"]
    else:
        problems = [p for p in BENCHMARK if p["tier"] in args.tiers]

    est_calls = len(problems) * sum({
        "full_pipeline": 9, "no_sympy": 9, "raw_groq": 1
    }.get(c, 5) for c in args.conditions)
    est_mins = round(est_calls * args.sleep / 60, 1)
    print(f"Problems: {len(problems)} | Conditions: {args.conditions}")
    print(f"Estimated API calls: ~{est_calls} | Estimated time: ~{est_mins} min")
    print(f"Sleep between calls: {args.sleep}s | Output: {args.output}\n")

    asyncio.run(run_eval(
        problems=problems,
        conditions=args.conditions,
        max_iterations=args.max_iter,
        sleep_between=args.sleep,
        output_path=args.output,
    ))
