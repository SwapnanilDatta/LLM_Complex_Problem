# Antigravity Educational Agent Backend

This repository contains the deterministic, linear reasoning backend for the Antigravity Educational Agent, designed to solve and explain complex problems across Mathematics, Automata Theory, and Machine Learning.

## Architecture

The backend is built using **FastAPI** for high-performance async serving, and **LangGraph** to enforce a strict, hallucination-free deterministic reasoning pipeline.

The pipeline execution flow:
1. **Intent Node**: Determines the domain (Maths, ML, or Automata).
2. **Builder Node**: Translates the problem into executable python code (sympy/sklearn) or a strictly formatted Mermaid JS graph.
3. **Solver Node**: Sandboxed execution of the python code to find the exact mathematical solution.
4. **Verifier Node**: Confirms the deterministic output is valid and solves the original problem.
5. **Explanation Node**: Uses a highly specialized, domain-specific educational prompt to explain the theoretical method step-by-step (without narrating code).
6. **Visualization Node**: Injects Matplotlib base64 charts or Mermaid SVG graphs directly into the markdown response.

## API Endpoints

- `POST /api/solve/stream` (Maths)
- `POST /api/ml/stream` (Machine Learning)
- `POST /api/automata/stream` (Automata Theory)

Each endpoint returns a Server-Sent Events (SSE) stream, emitting state updates as the graph traverses its nodes, terminating with a structured `UniversalResponse` payload.

## HuggingFace Docker Space Deployment

This backend is designed to run seamlessly in a HuggingFace Docker space.
The provided `Dockerfile` installs all mathematical plotting and machine learning dependencies and serves the FastAPI application on port `7860`.
