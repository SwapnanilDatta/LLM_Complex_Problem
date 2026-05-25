# Neuro-Symbolic Math Proof Agent
### *A Hybrid LangGraph + SymPy Mathematics Olympiad Solver*

This repository houses a **hybrid neuro-symbolic math proof agent** built for competition-level mathematics (IMO, Putnam, USAMO). 

The core architectural claim of this system is its **three-tier hybrid pipeline**: combining high-level **LLM strategic reasoning**, deterministic **Computer Algebra System (CAS) symbolic verification**, and rigorous **LLM logical validation** inside a self-correcting LangGraph loop. 

---

## 💡 What the Project Does

Large Language Models (LLMs) excel at creative problem-solving and high-level logical strategizing, but are notoriously prone to:
1. **Calculation drift:** Hallucinating expansions, algebraic simplifications, and arithmetic.
2. **Logic verification blindspots:** Accepting leaps in reasoning or circular proofs.
3. **Lack of self-correction:** Getting trapped in repetitive feedback loops without structural changes.

This project solves these limitations by implementing a **neuro-symbolic agent**:
* **Neural Component (LLM):** Large models (Llama 3.3 70B Versatile) handle the cognitive heavy lifting—breaking down questions, proposing lemmas, writing proof narratives, and verifying structure.
* **Symbolic Component (SymPy):** A deterministic Python math engine mathematically verifies every single algebraic identity asserted by the generator. 

By running these components in a state-based loop with real-time **Server-Sent Events (SSE)**, the system can discover mistakes, write formal feedback, and converge on an mathematically verified proof.

---

## ⚙️ How It Works (The Multi-Tier Pipeline)

The system works by routing the math problem through a self-correcting 4-stage LangGraph workflow:

```
            Problem Statement
                   ↓
         [Stage 1: Decomposer Node] (LLM) — Breaks problem into 2-4 subgoals
                   ↓
      ┌──→ [Stage 2: Generator Node] (LLM 70B) — Sequentially proves subgoals,
      │                                          tags algebraic expansions in <check>
      │            ↓
      │    [Stage 3: SymPy Checker Node] (Deterministic CAS)
      │            │
      │            ├── [FAIL] ──→ (Immediately halts, returns exact algebraic errors)
      │            ▼ [PASS]
      └─── [Stage 4: Verifier Node] (LLM 70B)
                   │
                   ├── [FAIL] ──→ (Analyzes structural flaws & missing lemmas)
                   ▼ [PASS]
             Verified Proof!
```

### Stage 1: Strategic Decomposition (`decomposer_node`)
When a problem is submitted, the **Decomposer** behaves like a human strategist. It breaks down the problem into 2-4 ordered, logical subgoals/milestones that must be solved to prove the main theorem (e.g., establishing a base case, proving a lemma, proving the inductive step).

### Stage 2: Asynchronous Proof Generation (`generator_node`)
The **Generator** takes the subgoals and drafts the proof. For every universal algebraic identity, expansion, or simplification it asserts, it must wrap the statement in an XML tag:
```html
<check>(x + 1)**2 == x**2 + 2*x + 1</check>
```
*Strict Prompt Constraints:* The generator is explicitly restricted from wrapping conditional equations it is attempting to solve (e.g., $x^2 - 2x - 3 = 0$) in check tags, focusing SymPy *only* on verifying structural algebraic steps.

### Stage 3: Deterministic Symbolic Verification (`sympy_node`)
The **SymPy Node** acts as the symbolic compiler. It extracts all `<check>` tags, parses their left-hand side (LHS) and right-hand side (RHS), and evaluates their difference:
$$\text{diff} = \text{simplify}(\text{LHS} - \text{RHS})$$
* **If $\text{diff} == 0$:** The step is mathematically sound. 
* **If $\text{diff} \neq 0$:** SymPy detects the exact step where algebra broke down. Execution is **immediately halted**, bypassing the expensive LLM Verifier, and routed straight back to the Generator with explicit compiler-level errors (e.g., `Step 2: ✗ simplifies to -x ≠ 0`).

### Stage 4: Logical & Structural Verification (`verifier_node`)
If SymPy confirms all mathematics are correct, the proof moves to the **Verifier**. The verifier performs a structural review inside a private mathematical `<scratchpad>` (checking for circular logic, edge cases, notation abuse, and leaps in reasoning). It outputs a strict verdict:
* **PASS:** Proof is logically complete. If it meets consecutive pass constraints, status becomes `verified` and the loop terminates successfully.
* **FAIL:** Verifier produces a numbered list of flaws which is concatenated with history and fed back to the Generator for retry.

---

## 🎨 Premium Real-Time React Frontend & Workspace

The project includes a stunning Vite-based React interface designed with a **glassmorphic deep dark theme** (`#0f1115`) optimized for viva/demo presentation:

* **Multi-Tab Design:** Toggle between the **🔍 Solver Workspace** (the real-time mathematical solver) and the **📊 Ablation Analytics** (the interactive graphs and tables viewer).
* **Asynchronous SSE Streaming:** Native fetch stream reader parses incoming JSON bytes and streams the agent's thought process character-by-character.
* **Dual-Column Terminal Grid:** Shows side-by-side terminal logs (the active thought process, checker outcomes, and iterations) on the left, and the culminating mathematical proof on the right.
* **SymPy Outcome Visualizer:** Custom card visualizers highlight SymPy checker updates. A passing check box is styled with a subtle emerald background and a left border, while failed algebra highlights in red with a detail block.
* **Interactive Katex Math Rendering:** Uses `react-katex` to beautifully format complex mathematical symbols, formulas, and proofs in standard LaTeX dynamically as they stream in.

---

## 📊 Ablation Evaluation Harness & Dashboard

To meet the high academic standards of a final-year project, the solver incorporates a **quantitative evaluation framework** containing a standardized **50-problem math benchmark** and an automated ablation suite.

### 1. The Standardized Math Benchmark (`backend/benchmark_suite.py`)
Features 50 distinct mathematical proofs divided into 5 standard difficulty categories:
1. **Basic Algebra** (identities, even/odd proofs, inequalities)
2. **Number Theory** (coprimes, prime factorization, GCD/LCM, irrationality)
3. **Combinatorics** (Pascal identity, pigeonhole principle, subsets, Vandermonde)
4. **Calculus & Analysis** (geometric series, Cauchy sequences, AM-GM, Mean Value Theorem)
5. **Olympiad Math** (IMO, Putnam competition inequalities, Fermat's little theorem)

### 2. The Ablation Testing Suite (`backend/eval_harness.py`)
Allows you to run mathematical experiments by testing your solver under 4 ablation configurations:
* **`full` (Full Pipeline):** The complete workflow containing the Decomposer, SymPy Checker, and LLM Verifier.
* **`no_sympy`:** Bypasses SymPy verification, passing proofs directly to the LLM Verifier. Demonstrates how much SymPy reduces rate-limit exhaustion and improves calculation accuracy.
* **`no_decomp`:** Runs without the initial Decomposer node, forcing the Generator to tackle complex problems in a single giant leap.
* **`single_pass`:** Bypasses the LangGraph state machine loops, performing only a single generation and a single verification step.

### 3. Interactive Analytics Dashboard (`frontend/src/EvalDashboard.jsx`)
Upload your generated `eval_results.json` run log to render a beautiful dashboard in the UI showing:
* **Convergence Rates by Tier:** Compare accuracy percentages across all math domains side-by-side.
* **Mean Iterations to Convergence:** Track speed differences under each ablation condition.
* **SymPy Value-Add Metrics:** View a direct count of algebraic errors intercepted by SymPy before the LLM verifier was run.
* **Aggregated Stat Cards:** Quantifies your system's exact performance gains (e.g. *"+15.4pp accuracy lift"*).

---

## 📂 Codebase Architecture

The project is strictly modularized to maintain clean separation of concerns:

```
finalyear/
├── backend/
│   ├── agent/
│   │   └── graph.py          # State, prompts, nodes (decomposer, generator, sympy, verifier), routing & LangGraph assembly
│   ├── db/
│   │   └── mongo.py          # Async MongoDB engine (Motor client) with dev-mode graceful fallback
│   ├── benchmark_suite.py    # 50 math benchmark problems across algebra, calculus, number theory, etc.
│   ├── eval_harness.py       # Async evaluation and ablation runner script (produces eval_results.json)
│   ├── main.py               # Lightweight FastAPI app, CORS middleware, lifespan events, and streaming SSE endpoints
│   ├── requirements.txt      # Python dependencies (sympy, langgraph, fastapi, motor, langchain-groq, etc.)
│   └── .env                  # API keys and connection parameters
└── frontend/
    ├── src/
    │   ├── App.jsx           # Main React component, SSE stream consumer, and tab navigator
    │   ├── EvalDashboard.jsx # Interactive dashboard displaying convergence graphs and tabular results
    │   ├── index.css         # Modern glassmorphic styles, custom badges, grids, and tab headers
    │   └── main.jsx          # React DOM mounting
    └── package.json          # Node dependencies (recharts, katex, lucide-react, react-markdown, remark-math)
```

---

## 🚀 Setup & Execution Guide

### 1. Backend Configuration
Navigate to `backend/`:
```bash
cd backend
```

Create a `.env` file containing:
```env
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=mongodb+srv://...  # (Optional: falls back to console logger if empty)
```

Create and activate virtual environment, install dependencies, and run:
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Unix:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Configuration
Navigate to `frontend/`:
```bash
cd ../frontend
```

Install packages and run development server:
```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser to start submitting problems!

---

## 🎓 Why this is an Outstanding Final Year Project

1. **AlphaProof Inspiration:** Implements a lightweight, accessible variant of Google DeepMind's AlphaProof/AlphaGeometry conceptual stack (combining cognitive LLM systems with formal symbolic math engines).
2. **Symbolic Guarantee:** Leverages standard symbolic simplification, raising proof validity confidence above standard LLM verifiers.
3. **Advanced System Design:** Uses modern web paradigms (Server-Sent Events) instead of slow HTTP block responses, and compiles real-time LangGraph states asynchronously.
