# 🧠 LLM Complex Problem Solver

A sophisticated **multi-domain reasoning engine** that solves complex mathematical problems, automata theory, and machine learning challenges through a deterministic LLM pipeline with symbolic verification and human-like step-by-step explanations.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Backend Routes](#backend-routes)
- [Setup & Installation](#setup--installation)
- [Usage Examples](#usage-examples)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)

---

## 🎯 Overview

This project implements a **deterministic, multi-stage reasoning pipeline** designed to:

✅ **Break down complex problems** into manageable sub-goals (decomposer)  
✅ **Generate rigorous proofs/solutions** with inline symbolic verification tags (generator)  
✅ **Verify algebraically** using SymPy before LLM verification (symbolic checker)  
✅ **Validate logically** with advanced LLM-based verification (verifier)  
✅ **Converge iteratively** with feedback loops until max iterations or required passes  
✅ **Support multiple domains** — mathematics, automata theory, and machine learning  
✅ **Stream real-time progress** via Server-Sent Events (SSE)  
✅ **Visualize solutions** with plots, graphs, and interactive dashboards  

### Key Innovation: Neuro-Symbolic Reasoning

The system combines:
- **Large Language Models (Groq Llama-3.3-70B)** for reasoning and verification
- **SymPy symbolic computation** for algebraic correctness checking
- **LangGraph state machines** for deterministic workflow orchestration
- **SSE streaming** for real-time frontend updates

---

## 🛠 Tech Stack

### Language Composition
- **TypeScript**: 69.3% (Frontend API routes, Next.js)
- **Python**: 16.5% (Backend core, LLM agents, symbolic engines)
- **JavaScript**: 10.6% (React frontend)
- **CSS**: 3.3% (Styling)
- **Other**: 0.3%

### Core Technologies

**Backend:**
- FastAPI (async Python web framework)
- LangGraph (workflow orchestration)
- LangChain (LLM integrations)
- Groq API (fast LLM inference)
- SymPy (symbolic mathematics)
- Motor (async MongoDB driver)
- SSE Starlette (server-sent events)

**Frontend:**
- Next.js (React framework)
- TypeScript (type safety)
- Recharts (interactive graphs)
- KaTeX (math rendering)
- Markdown rendering with MathJax

**Infrastructure:**
- Hugging Face Spaces (production backend)
- MongoDB (optional data persistence)

---

## 📂 Project Architecture

```
LLM_Complex_Problem/
├── backend/
│   ├── api/
│   │   └── routes.py                    # Main API router with streaming endpoints
│   ├── services/
│   │   └── pipeline.py                  # Multi-domain pipeline orchestration
│   ├── agent/
│   │   ├── graph.py                     # LangGraph state machine (decomposer → generator → sympy → verifier)
│   │   └── graph_plot.py                # Variant for plot generation
│   ├── engines/
│   │   ├── maths.py                     # Math problem solver
│   │   ├── automata.py                  # Automata theory solver
│   │   └── ml.py                        # ML problem solver
│   ├── models/
│   │   ├── state.py                     # PipelineState TypedDict
│   │   ├── schemas.py                   # Pydantic request/response schemas
│   │   └── response.py                  # UniversalResponse format
│   ├── prompts/
│   │   └── templates.py                 # Domain-specific LLM prompts
│   ├── validators/
│   │   └── verification.py              # Output validation logic
│   ├── visualizers/
│   │   └── renderers.py                 # Plot/graph extraction & rendering
│   ├── main.py                          # FastAPI app entry point
│   ├── requirements.txt                 # Python dependencies
│   └── .env                             # API keys & config
│
├── app/                                 # Next.js frontend
│   ├── api/
│   │   ├── maths/solve/route.ts         # POST /api/maths/solve → streams to backend
│   │   ├── automata/stream/route.ts     # POST /api/automata/stream → streams to backend
│   │   └── ml/stream/route.ts           # POST /api/ml/stream → streams to backend
│   └── ...
│
└── frontend/                            # Legacy React frontend (optional)
    ├── src/
    │   ├── App.jsx                      # Main SSE consumer
    │   ├── EvalDashboard.jsx            # Analytics dashboard
    │   └── main.jsx                     # React DOM entry
    └── package.json
```

---

## 🚀 Backend Routes

### Core Streaming Endpoints

#### 1. **Mathematics Solver**
```
POST /api/maths/solve
POST /api/solve/stream          # Alias for backwards compatibility
```

**Request Body:**
```json
{
  "problem": "Prove that if f(x) = x² + 2x + 1, then f(x) = (x+1)²",
  "max_iterations": 8,           // Optional
  "required_passes": 1,          // Optional
  "attachments": []              // Optional: file/image uploads
}
```

**Response (Server-Sent Events):**
- **Event Types:** `start`, `node_update`, `done`, `error`
- **Streaming Architecture:** Real-time updates as each node completes

**Example Response Flow:**
```
event: start
data: {"run_id": "run_1234567890", "problem": "Prove that..."}

event: node_update
data: {
  "node": "decomposer",
  "status": "running",
  "mode": "maths",
  "code_snippet": "1. Expand (x+1)²\n2. Simplify...",
  "full_update": { ... }
}

event: node_update
data: {
  "node": "generator",
  "status": "running",
  "current_proof": "Starting proof...",
  "full_update": { ... }
}

event: done
data: {
  "run_id": "run_1234567890",
  "status": "completed",
  "final_answer": "Proof verified successfully...",
  "universal_response": { ... }
}
```

---

#### 2. **Automata Theory Solver**
```
POST /api/automata/stream
```

**Request Body:**
```json
{
  "problem": "Design a DFA that accepts binary strings ending with '01'",
  "max_iterations": 8,
  "required_passes": 1,
  "attachments": []
}
```

**Features:**
- Converts problem to Mermaid diagram syntax
- Validates state transitions
- Generates step-by-step explanation
- Real-time streaming of results

---

#### 3. **Machine Learning Problem Solver**
```
POST /api/ml/stream
```

**Request Body:**
```json
{
  "problem": "Build a neural network that classifies MNIST digits",
  "max_iterations": 8,
  "required_passes": 1,
  "attachments": []
}
```

**Features:**
- Python code generation & execution
- Model training with verification
- Accuracy metrics & visualizations
- Educational step-by-step breakdown

---

#### 4. **Health Check**
```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "pipeline": "strict-linear"
}
```

---

## 🔄 Pipeline Architecture

### Processing Stages

The system executes in a **strict linear pipeline** with optional loops:

```
┌─────────────────────────────────────────────────────────────┐
│                    VISION NODE (Optional)                   │
│           Processes images/attachments if present            │
│  Returns early if image-based problem is solved directly    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   INTENT NODE                               │
│            Routes problem to correct domain                 │
│                (maths/automata/ml)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  BUILDER NODE                               │
│           Structures problem into executable code            │
│            (Python, Mermaid, or pseudocode)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  SOLVER NODE                                │
│          Executes problem-solving logic safely              │
│            (sandbox execution with timeouts)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 VERIFIER NODE                               │
│      Validates execution output deterministically           │
│     Returns END if verification fails (mandatory stop)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              EXPLANATION NODE                               │
│       Generates human-readable step-by-step solution        │
│        (Only if verification passed)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            VISUALIZATION NODE                               │
│      Extracts plots, graphs, and final formatting           │
│         Returns final answer with visualizations            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
                    [END]
```

### Alternative: Mathematical Proof Pipeline

For pure mathematical proofs (in `backend/agent/graph.py`):

```
┌──────────────────────┐
│    DECOMPOSER        │  Breaks problem into sub-goals
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   GENERATOR          │  Generates proof with <check> tags
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  SYMPY_CHECKER       │  Verifies algebraic steps
└──────────┬───────────┘
           │
      ┌────┴────┐
      │   PASS  │  FAIL
      │         │
      ▼         ▼
   VERIFIER ────┐
      │         │
      ├─────────┘
      │
   PASS/FAIL
      │
   Converged? ──┐
      │         │ NO
      │         ▼
      │      GENERATOR (retry)
      │         │
      └─────────┘
```

---

## 📡 API Response Format

### UniversalResponse Schema

```typescript
interface UniversalResponse {
  domain: string;           // "maths" | "automata" | "ml"
  steps: StepOutput[];      // Array of processing steps
  final_answer: string;     // Complete solution with visualizations
  verified: boolean;        // Whether output passed verification
  visualization: null;      // Placeholder for future use
  metadata: ResponseMetadata;
}

interface StepOutput {
  title: string;            // e.g., "Vision", "Intent", "Builder"
  content: string;          // Node-specific output
  is_verified: boolean;     // Verification status (if applicable)
}

interface ResponseMetadata {
  execution_time_ms: number;
  engine_used: string;      // The domain that solved it
}
```

---

## 🔧 Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (optional, for persistence)

### Backend Setup

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cat > .env << EOF
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_API_KEY1=fallback_key_1
   GROQ_API_KEY2=fallback_key_2
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db_name
   EOF
   ```

5. **Start backend server:**
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. **Navigate to frontend (Next.js):**
   ```bash
   cd app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cat > .env.local << EOF
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   EOF
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:3000`

---

## 💻 Usage Examples

### Example 1: Mathematical Proof

**Request:**
```bash
curl -X POST http://localhost:8000/api/maths/solve \
  -H "Content-Type: application/json" \
  -d '{
    "problem": "Prove that the sum of two even numbers is always even",
    "max_iterations": 5,
    "required_passes": 1
  }'
```

**Pipeline Execution:**
1. **Intent Node:** Routes to math domain
2. **Builder Node:** Structures as symbolic logic problem
3. **Solver Node:** Generates algebraic proof
4. **Verifier Node:** Checks for logical correctness
5. **Explanation Node:** Creates step-by-step tutorial
6. **Visualization Node:** Formats final answer

---

### Example 2: Automata Design

**Request:**
```bash
curl -X POST http://localhost:8000/api/automata/stream \
  -H "Content-Type: application/json" \
  -d '{
    "problem": "Create a DFA that accepts strings with alternating 0s and 1s"
  }'
```

**Output:**
- Mermaid diagram of state machine
- Transition rules
- Verification of correctness
- Educational explanation

---

### Example 3: ML Model Building

**Request:**
```bash
curl -X POST http://localhost:8000/api/ml/stream \
  -H "Content-Type: application/json" \
  -d '{
    "problem": "Build a logistic regression classifier for iris dataset"
  }'
```

**Output:**
- Python implementation
- Training execution with metrics
- Accuracy visualization
- Business interpretation

---

## 🔐 Stream Handling

### Frontend Consumption (TypeScript Example)

```typescript
async function solveStream(problem: string, domain: string) {
  const response = await fetch(`/api/${domain}/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem })
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split('\n');
    
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        const eventType = line.slice(7);
        // Handle: start, node_update, done, error
      }
      if (line.startsWith('data: ')) {
        const payload = JSON.parse(line.slice(6));
        // Update UI with payload
      }
    }
  }
}
```

---

## 📊 Advanced Features

### Symbolic Verification (SymPy)

The generator wraps algebraic steps in `<check>` tags:

```xml
<check>(a + b)² == a² + 2*a*b + b²</check>
<check>x² - 4 == (x - 2)*(x + 2)</check>
```

SymPy automatically verifies these before expensive LLM verification.

### Multi-Key Fallback

```python
# Primary key
llm = ChatGroq(api_key=os.environ["GROQ_API_KEY"])

# Fallback keys automatically used if primary is rate-limited
llm = llm.with_fallbacks([
    ChatGroq(api_key=os.environ["GROQ_API_KEY1"]),
    ChatGroq(api_key=os.environ["GROQ_API_KEY2"]),
])
```

### Convergence Criteria

Proofs/solutions must:
- ✅ Pass SymPy algebraic checks (if applicable)
- ✅ Pass LLM logical verification
- ✅ Achieve required consecutive passes (default: 1)
- ✅ Complete within max iterations (default: 8)

---

## 🧪 Testing & Evaluation

### Evaluation Harness

Run benchmarks with ablation studies:

```bash
python backend/eval_harness.py --condition full --tier easy
```

**Supports 4 configurations:**
1. **`full`** — Complete pipeline with all checks
2. **`no_sympy`** — Bypasses symbolic verification
3. **`no_decomp`** — Skips problem decomposition
4. **`single_pass`** — Single generation, single verification

### Benchmark Datasets

Located in `backend/benchmark_suite.py`:
- **Algebra** (linear equations, factoring)
- **Number Theory** (primes, divisibility, Fermat's Little Theorem)
- **Calculus** (limits, derivatives, series)
- **Olympiad Math** (IMO-style inequalities)

---

## 📈 Metrics & Monitoring

### Response Metrics

Each response includes:
```json
{
  "execution_time_ms": 5432,      // Total runtime
  "engine_used": "maths",         // Domain solver
  "verified": true,               // Passed all checks
  "convergence_steps": 2          // Iterations to solve
}
```

### Health Check

```bash
curl http://localhost:8000/api/health
# {"status": "ok", "pipeline": "strict-linear"}
```

---

## 🤝 Contributing

### Code Style
- Python: PEP 8 (use `black` formatter)
- TypeScript: Prettier + ESLint
- Commit messages: Conventional Commits

### Adding a New Domain

1. **Create solver:** `backend/engines/your_domain.py`
2. **Add prompts:** `backend/prompts/templates.py`
3. **Update pipeline:** Add conditional in `backend/services/pipeline.py`
4. **Create route:** `app/api/your_domain/stream/route.ts`
5. **Write tests:** `tests/test_your_domain.py`

---

## 📝 License

This project is part of a Final Year academic research project at the University.

---

## 🙏 Acknowledgments

- **Groq** for fast LLM inference via API
- **LangChain & LangGraph** for agent orchestration
- **SymPy** for symbolic mathematics
- **Hugging Face** for model hosting infrastructure

---

## 📧 Contact

For questions or issues, please open a GitHub issue or contact the maintainer.

---

### 🚀 Get Started

```bash
# Backend
cd backend && pip install -r requirements.txt && python -m uvicorn main:app --reload

# Frontend (in another terminal)
cd app && npm install && npm run dev

# Open http://localhost:3000 and start solving!
```

**Happy problem solving! 🎓**
