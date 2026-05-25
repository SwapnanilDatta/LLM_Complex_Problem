"""
eval_harness.py  (Ollama edition — also backwards compatible with Groq)
=======================================================================
Runs 3 ablation conditions:

  Condition A — full_pipeline   : Decomposer→Generator→SymPy→Verifier loop
  Condition B — no_sympy        : Decomposer→Generator→Verifier (no SymPy)
  Condition C — raw_llm         : Single generator call, no verification

Backend selection (env vars or --backend flag):
  --backend ollama   → uses graph_ollama.py  (default, no API key needed)
  --backend groq     → uses graph.py         (requires GROQ_API_KEY)

Usage examples:
  # Smoke test — 3 easy problems, Ollama
  python eval_harness.py --ids alg_01 alg_02 nt_01 --backend ollama

  # Full 30-problem run on Ollama, all 3 conditions
  python eval_harness.py --all --backend ollama --max-iter 3 --sleep 0 --output eval_ollama.json

  # Just algebra tier, compare all conditions
  python eval_harness.py --tiers algebra --backend ollama --output eval_alg.json

  # Resume an interrupted run
  python eval_harness.py --all --backend ollama --output eval_ollama.json  # re-run same command

  # Groq run (original behaviour)
  python eval_harness.py --all --backend groq --sleep 3 --output eval_groq.json
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


# ── Rate-limit-aware LLM wrapper (still useful for Groq) ─────────────────────
async def _invoke_with_backoff(llm, messages, max_retries: int = 6):
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
    status:             str       # "verified"|"failed"|"timeout"|"error"|"produced"
    iterations:         int
    converged:          bool      # True only for genuinely verified proofs
    produced_output:    bool      # True if any proof text was generated
    sympy_intercepts:   int
    llm_verifier_fails: int
    elapsed_seconds:    float = 0.0
    error_message:      str   = ""
    proof_length:       int   = 0
    proof_length_words: int   = 0  # word count — better quality proxy than chars
    raw_proof:          str   = ""


@dataclass
class EvalRun:
    run_id:     str
    timestamp:  str
    backend:    str
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
            conv    = sum(r.converged for r in rs)
            prod    = sum(r.produced_output for r in rs)
            errors  = sum(1 for r in rs if r.status == "error")
            timeouts= sum(1 for r in rs if r.status == "timeout")
            avg_wc  = round(sum(r.proof_length_words for r in rs) / max(prod, 1), 0)
            rows.append({
                "condition":               condition,
                "tier":                    tier,
                "n_problems":              n,
                "convergence_rate":        round(conv / n, 3) if n else 0,
                "output_rate":             round(prod / n, 3) if n else 0,
                "mean_iterations":         round(sum(r.iterations for r in rs) / n, 2) if n else 0,
                "total_sympy_intercepts":  sum(r.sympy_intercepts for r in rs),
                "total_llm_verifier_fails": sum(r.llm_verifier_fails for r in rs),
                "mean_elapsed_s":          round(sum(r.elapsed_seconds for r in rs) / n, 1) if n else 0,
                "mean_proof_words":        avg_wc,
                "errors":                  errors,
                "timeouts":                timeouts,
            })
        return {"rows": rows}


# ── Graph builders ────────────────────────────────────────────────────────────
def _make_builders(backend: str) -> dict:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    if backend == "ollama":
        from graph_ollama import (
            ProofState, decomposer_node, generator_node,
            sympy_node, verifier_node,
            route_after_verifier, build_graph,
            GENERATOR_SYSTEM, _llm_gen, _extract_tag,
        )
        graph_mod_name = "graph_ollama"
    else:
        from agent.graph import (
            ProofState, decomposer_node, generator_node,
            sympy_node as sympy_node, verifier_node,
            route_after_verifier, build_graph,
            GENERATOR_SYSTEM, _llm_gen, _extract_tag,
        )
        graph_mod_name = "agent.graph"

    from langgraph.graph import END, StateGraph
    from langchain_core.messages import HumanMessage, SystemMessage

    def _build_full_pipeline():
        return build_graph()

    def _build_no_sympy():
        async def verifier_no_sympy(state):
            patched = dict(state)
            patched["status"] = "running"   # force LLM verifier to always run
            return await verifier_node(patched)

        builder = StateGraph(ProofState)
        builder.add_node("decomposer", decomposer_node)
        builder.add_node("generator",  generator_node)
        builder.add_node("verifier",   verifier_no_sympy)
        builder.set_entry_point("decomposer")
        builder.add_edge("decomposer", "generator")
        builder.add_edge("generator",  "verifier")
        builder.add_conditional_edges("verifier", route_after_verifier)
        return builder.compile()

    def _build_raw_llm():
        """Single-pass generator. Marks status='produced' (not 'verified')."""
        async def raw_generator(state: ProofState) -> dict:
            llm = _llm_gen()
            messages = [
                SystemMessage(content=GENERATOR_SYSTEM),
                HumanMessage(content=f"Problem: {state['problem']}"),
            ]
            try:
                response = await _invoke_with_backoff(llm, messages)
                raw   = response.content
                proof = _extract_tag(raw, "proof") or raw
                summ  = _extract_tag(raw, "summary") or ""
            except Exception as e:
                proof, summ = f"[ERROR: {e}]", ""
            return {
                "current_proof": proof,
                "summary":       summ,
                "iteration":     1,
                "status":        "produced",   # distinct from "verified"
                "history": [{
                    "iteration":      1,
                    "proof":          proof,
                    "summary":        summ,
                    "feedback":       "Raw single-pass — no verification.",
                    "sympy_feedback": "",
                    "verdict":        "UNVERIFIED",
                }],
            }

        builder = StateGraph(ProofState)
        builder.add_node("generator", raw_generator)
        builder.set_entry_point("generator")
        builder.add_edge("generator", END)
        return builder.compile()

    return {
        "full_pipeline": _build_full_pipeline,
        "no_sympy":      _build_no_sympy,
        "raw_llm":       _build_raw_llm,
    }


# ── Single problem evaluator ──────────────────────────────────────────────────
async def evaluate_one(
    problem: dict,
    condition: str,
    builders: dict,
    max_iterations: int = 4,
    timeout: float = 300.0,
    sleep_between: float = 0.5,
) -> ProblemResult:
    start = time.monotonic()
    try:
        graph = builders[condition]()
    except Exception as e:
        return ProblemResult(
            problem_id=problem["id"], tier=problem["tier"], condition=condition,
            status="error", iterations=0, converged=False, produced_output=False,
            sympy_intercepts=0, llm_verifier_fails=0,
            error_message=f"Graph build error: {e}",
        )

    initial_state = {
        "problem":           problem["problem"],
        "subgoals":          "",
        "current_proof":     "",
        "summary":           "",
        "feedback":          "",
        "sympy_feedback":    "",
        "iteration":         0,
        "consecutive_passes": 0,
        "max_iterations":    max_iterations,
        "required_passes":   1,
        "status":            "running",
        "history":           [],
    }

    current          = dict(initial_state)
    sympy_intercepts = 0
    llm_fails        = 0

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
            converged=False, produced_output=bool(current.get("current_proof")),
            sympy_intercepts=sympy_intercepts, llm_verifier_fails=llm_fails,
            elapsed_seconds=round(time.monotonic() - start, 2),
        )
    except Exception as exc:
        return ProblemResult(
            problem_id=problem["id"], tier=problem["tier"], condition=condition,
            status="error", iterations=current.get("iteration", 0),
            converged=False, produced_output=bool(current.get("current_proof")),
            sympy_intercepts=sympy_intercepts, llm_verifier_fails=llm_fails,
            error_message=str(exc)[:400],
            elapsed_seconds=round(time.monotonic() - start, 2),
        )

    await asyncio.sleep(sleep_between)

    proof    = current.get("current_proof", "")
    status   = current.get("status", "failed")
    converged        = (status == "verified")
    produced_output  = bool(proof.strip()) and status != "error"

    return ProblemResult(
        problem_id=problem["id"],
        tier=problem["tier"],
        condition=condition,
        status=status,
        iterations=current.get("iteration", 0),
        converged=converged,
        produced_output=produced_output,
        sympy_intercepts=sympy_intercepts,
        llm_verifier_fails=llm_fails,
        elapsed_seconds=round(time.monotonic() - start, 2),
        proof_length=len(proof),
        proof_length_words=len(proof.split()),
        raw_proof=proof[:600],
    )


# ── Main eval loop ─────────────────────────────────────────────────────────────
async def run_eval(
    problems:       list[dict],
    conditions:     list[str],
    builders:       dict,
    max_iterations: int,
    sleep_between:  float,
    output_path:    str,
    backend:        str,
) -> EvalRun:

    run = EvalRun(
        run_id=f"eval_{int(time.time())}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        backend=backend,
        conditions=conditions,
        tiers=list({p["tier"] for p in problems}),
    )

    # Resume support
    completed_tasks: set[tuple[str, str]] = set()
    if os.path.exists(output_path):
        try:
            with open(output_path) as f:
                data = json.load(f)
            for r_dict in data.get("results", []):
                # Backfill fields missing from old saves
                r_dict.setdefault("produced_output", r_dict.get("converged", False))
                r_dict.setdefault("proof_length_words", len(r_dict.get("raw_proof","").split()))
                r = ProblemResult(**r_dict)
                run.results.append(r)
                completed_tasks.add((r.condition, r.problem_id))
            print(f"Resumed from {output_path} ({len(completed_tasks)} tasks already done)")
        except Exception as e:
            print(f"Warning: could not load previous results: {e}")

    total = len(problems) * len(conditions)
    done  = len(completed_tasks)

    for condition in conditions:
        print(f"\n── Condition: {condition} ──────────────────────────────────────────")
        for problem in problems:
            if (condition, problem["id"]) in completed_tasks:
                print(f"  [skip] {problem['id']:<12} (already done)")
                continue

            result = await evaluate_one(
                problem, condition, builders,
                max_iterations=max_iterations,
                sleep_between=sleep_between,
            )
            run.results.append(result)
            done += 1

            icon = "✓" if result.converged else ("~" if result.produced_output else ("⚠" if result.status == "timeout" else "✗"))
            print(
                f"  [{done:>3}/{total}] {icon} {result.problem_id:<12} "
                f"status={result.status:<10} iters={result.iterations} "
                f"words={result.proof_length_words:<5} "
                f"sympy={result.sympy_intercepts} llmfail={result.llm_verifier_fails} "
                f"t={result.elapsed_seconds:.1f}s"
            )
            _save(run, output_path)

    print(f"\nSaved → {output_path}")
    _print_summary(run)
    return run


def _save(run: EvalRun, path: str):
    out = {
        "run_id":     run.run_id,
        "timestamp":  run.timestamp,
        "backend":    run.backend,
        "conditions": run.conditions,
        "tiers":      run.tiers,
        "results":    [asdict(r) for r in run.results],
        "summary":    run.summary(),
    }
    with open(path, "w") as f:
        json.dump(out, f, indent=2)


def _print_summary(run: EvalRun):
    s = run.summary()
    print(f"\n── Summary ({run.backend}) ────────────────────────────────────────────")
    header = (
        f"{'Condition':<18} {'Tier':<15} {'N':>3} "
        f"{'Verified%':>9} {'Output%':>8} {'AvgIter':>8} "
        f"{'SymPy↑':>7} {'LLMFail':>8} {'AvgWords':>9}"
    )
    print(header)
    print("─" * 90)
    for row in s["rows"]:
        print(
            f"{row['condition']:<18} {row['tier']:<15} {row['n_problems']:>3} "
            f"{row['convergence_rate']*100:>8.0f}% {row['output_rate']*100:>7.0f}% "
            f"{row['mean_iterations']:>8.1f} "
            f"{row['total_sympy_intercepts']:>7} {row['total_llm_verifier_fails']:>8} "
            f"{row['mean_proof_words']:>9.0f}"
        )
    errors   = sum(r["errors"]   for r in s["rows"])
    timeouts = sum(r["timeouts"] for r in s["rows"])
    if errors or timeouts:
        print(f"\n  ⚠  Errors: {errors}  |  Timeouts: {timeouts}")


# ── CLI ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MathProof eval harness (Ollama + Groq)")
    parser.add_argument("--all",      action="store_true", help="Run all 30 problems × 3 conditions")
    parser.add_argument("--tiers",    nargs="+", choices=["algebra", "number_theory", "olympiad"], default=["algebra"])
    parser.add_argument("--conditions", nargs="+",
                        choices=["full_pipeline", "no_sympy", "raw_llm"],
                        default=["full_pipeline", "no_sympy", "raw_llm"])
    parser.add_argument("--ids",      nargs="+", help="Run specific problem IDs (e.g. alg_01 nt_02)")
    parser.add_argument("--backend",  choices=["ollama", "groq"], default="ollama",
                        help="LLM backend to use (default: ollama)")
    parser.add_argument("--model",    default=None,
                        help="Override model name (e.g. qwen2.5:7b, llama3.2:3b)")
    parser.add_argument("--max-iter", type=int,   default=3,
                        help="Max refinement iterations per problem (default 3, use 2 for speed)")
    parser.add_argument("--sleep",    type=float, default=0.5,
                        help="Seconds between problems (default 0.5 for Ollama; use 3+ for Groq)")
    parser.add_argument("--timeout",  type=float, default=180.0,
                        help="Per-problem timeout in seconds (default 180)")
    parser.add_argument("--output",   default="eval_results.json")
    args = parser.parse_args()

    # Override model via CLI
    if args.model:
        if args.backend == "ollama":
            os.environ["OLLAMA_MODEL"] = args.model
        else:
            print(f"Warning: --model flag ignored for backend '{args.backend}'")

    from benchmark_suite import BENCHMARK

    if args.ids:
        problems = [p for p in BENCHMARK if p["id"] in args.ids]
        if not problems:
            print(f"No problems found for IDs: {args.ids}")
            sys.exit(1)
    elif args.all:
        problems = BENCHMARK
        args.conditions = ["full_pipeline", "no_sympy", "raw_llm"]
    else:
        problems = [p for p in BENCHMARK if p["tier"] in args.tiers]

    # Estimate time
    iters_map = {"full_pipeline": args.max_iter * 3 + 1, "no_sympy": args.max_iter * 2 + 1, "raw_llm": 1}
    est_llm_calls = sum(iters_map.get(c, 4) for c in args.conditions) * len(problems)
    est_secs = est_llm_calls * (0.5 if args.backend == "ollama" else 2.0) + len(problems) * len(args.conditions) * args.sleep
    print(f"Backend:    {args.backend}")
    print(f"Model:      {os.environ.get('OLLAMA_MODEL','(groq)')} ")
    print(f"Problems:   {len(problems)} | Conditions: {args.conditions}")
    print(f"Max iters:  {args.max_iter} | Sleep: {args.sleep}s | Timeout: {args.timeout}s")
    print(f"Est. time:  ~{est_secs/60:.1f} min (rough, Ollama inference time varies)")
    print(f"Output:     {args.output}\n")

    builders = _make_builders(args.backend)

    asyncio.run(run_eval(
        problems=problems,
        conditions=args.conditions,
        builders=builders,
        max_iterations=args.max_iter,
        sleep_between=args.sleep,
        output_path=args.output,
        backend=args.backend,
    ))
