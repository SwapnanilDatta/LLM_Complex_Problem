import re
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage

from models.state import PipelineState
from core.llm import get_llm_fast, get_llm_reasoning
from prompts.templates import (
    MATH_PROBLEM_BUILDER_PROMPT,
    MATH_EXPLANATION_PROMPT,
    AUTOMATA_PROBLEM_BUILDER_PROMPT,
    AUTOMATA_EXPLANATION_PROMPT,
    ML_PROBLEM_BUILDER_PROMPT,
    ML_EXPLANATION_PROMPT
)
from engines.maths import solve_math_problem
from engines.automata import solve_automata_problem
from engines.ml import solve_ml_problem
from validators.verification import verify_execution
from visualizers.renderers import extract_plot_data, extract_automata_graph

def _extract_tag(text: str, tag: str) -> str:
    # First try XML style tags with a mandatory closing tag
    m = re.search(rf"<{tag}>(.*?)</{tag}>", text, re.DOTALL | re.IGNORECASE)
    if m:
        return m.group(1).strip()
        
    # If no closing tag, try just finding the opening tag and taking everything after
    m = re.search(rf"<{tag}>(.*)", text, re.DOTALL | re.IGNORECASE)
    if m:
        return m.group(1).strip()
    
    # Try markdown blocks
    md = re.search(r"```(?:\w+)?\n(.*?)\n```", text, re.DOTALL)
    if md:
        return md.group(1).strip()
        
    md_open = re.search(r"```(?:\w+)?\n(.*)", text, re.DOTALL)
    if md_open:
        return md_open.group(1).strip()
        
    return text.strip().strip("`")

def _render_attachment_section(attachments: list[dict] | None) -> str:
    if not attachments:
        return ""

    lines = ["\n\nAttached files/images:"]
    for attachment in attachments:
        name = attachment.get("name", "unknown")
        att_type = attachment.get("type", "file")
        
        # We don't want to dump base64 data into the text prompt.
        # It will be passed structurally to the LLM via `attachments`.
        if att_type == "file" and attachment.get("data"):
            # For text files, we can include their content
            content = attachment.get("data", "")
            # Limit to 2000 chars just in case
            if len(content) > 2000:
                content = content[:2000] + "\n...[truncated]"
            lines.append(f"- {name}:\n```\n{content}\n```")
        else:
            lines.append(f"- {name} ({att_type})")

    return "\n".join(lines)

async def vision_node(state: PipelineState) -> dict:
    attachments = state.get("attachments", [])
    images = [att for att in attachments if att.get("type") == "image" and att.get("data")]
    
    if not images:
        return {"status": "routing"}
        
    llm = get_llm_reasoning(temperature=0.2)
    prompt = "You are an expert tutor. Please solve the problem presented in the attached image(s) step-by-step."
    if state.get("query"):
        prompt += f"\n\nUser Question: {state['query']}"
        
    res = await llm.ainvoke([
        HumanMessage(content=prompt)
    ], attachments=images)
    
    final_text = res.content.strip()
    
    # Skip the deterministic pipeline and output the vision solve directly
    return {
        "final_answer": final_text, 
        "explanation": final_text,
        "verified_output": "Direct Vision Solve",
        "verified": True,
        "status": "completed"
    }

async def intent_node(state: PipelineState) -> dict:
    domain = state.get("domain", "maths")
    return {"domain": domain, "status": "understanding"}

async def builder_node(state: PipelineState) -> dict:
    domain = state.get("domain", "maths")
    llm = get_llm_reasoning(temperature=0.0)
    
    if domain == "maths":
        sys_prompt = MATH_PROBLEM_BUILDER_PROMPT
        tag = "python"
    elif domain == "automata":
        sys_prompt = AUTOMATA_PROBLEM_BUILDER_PROMPT
        tag = "mermaid"
    else:
        sys_prompt = ML_PROBLEM_BUILDER_PROMPT
        tag = "python"

    attachment_text = _render_attachment_section(state.get("attachments"))
    res = await llm.ainvoke([
        SystemMessage(content=sys_prompt),
        HumanMessage(content=f"{state['query']}{attachment_text}")
    ], attachments=state.get("attachments"))
    code = _extract_tag(res.content, tag)
    if tag == "python" and code.startswith("python\n"):
        code = code[7:]
    
    return {"structured_problem": code, "status": "solving"}

async def solver_node(state: PipelineState) -> dict:
    domain = state.get("domain", "maths")
    code = state.get("structured_problem", "")
    
    if domain == "maths":
        result = await solve_math_problem(code)
    elif domain == "automata":
        result = solve_automata_problem(code) # Note: MVP is sync
    else:
        result = await solve_ml_problem(code)
        
    return {"solver_output": result, "status": "verifying"}

async def verifier_node(state: PipelineState) -> dict:
    # Deterministic verification layer
    solver_out = state.get("solver_output", {})
    is_valid, msg = verify_execution(solver_out)
    
    if not is_valid:
        # Mandatory stop condition on failure
        return {
            "verified": False,
            "verification_feedback": msg,
            "status": "failed_verification"
        }
        
    return {
        "verified": True,
        "verified_output": solver_out.get("output", ""),
        "status": "explaining"
    }

async def explanation_node(state: PipelineState) -> dict:
    if not state.get("verified", False):
        # Do NOT generate explanations for unverified outputs
        return {"explanation": "Verification failed. No explanation generated."}

    domain = state.get("domain", "maths")
    llm = get_llm_reasoning(temperature=0.2)
    
    # Simple MVP just handles Math explanation well; others can be generic for now.
    if domain == "maths":
        prompt = MATH_EXPLANATION_PROMPT.format(
            problem=state["query"],
            solver_code=state["structured_problem"],
            solver_output=state["verified_output"]
        )
    elif domain == "automata":
        prompt = AUTOMATA_EXPLANATION_PROMPT.format(
            problem=state["query"],
            solver_output=state["verified_output"]
        )
    elif domain == "ml":
        prompt = ML_EXPLANATION_PROMPT.format(
            problem=state["query"],
            solver_output=state["verified_output"]
        )
    else:
        prompt = (
            f"You are an expert tutor in {domain.upper()}.\n"
            f"Your job is to write a final, step-by-step solution to the problem exactly like a bright student would write in a university exam.\n"
            f"You MUST base your explanation ONLY on the provided deterministic output.\n\n"
            f"Problem:\n{state['query']}\n\n"
            f"Code/Config:\n{state['structured_problem']}\n\n"
            f"Output (Verified):\n{state['verified_output']}\n\n"
            f"Provide a clear, highly educational, STEP-BY-STEP explanation. "
            f"\nWrap your final text explanation in <explanation>...</explanation> tags."
        )

    attachment_text = _render_attachment_section(state.get("attachments"))
    if attachment_text:
        prompt += attachment_text

    res = await llm.ainvoke([HumanMessage(content=prompt)], attachments=state.get("attachments"))
    explanation = _extract_tag(res.content, "explanation")
    
    return {"explanation": explanation, "status": "visualizing"}

async def visualization_node(state: PipelineState) -> dict:
    explanation = state.get("explanation", "")
    verified_out = state.get("verified_output", "")
    
    import re
    # Extract any generated matplotlib plots from the sandbox execution (Maths/ML)
    plots = re.findall(r"(!\[Generated Plot\]\(data:image/png;base64,[^\)]+\))", verified_out)
    plot_markdown = "\n\n".join(plots)
    
    final_answer = explanation
    if plot_markdown:
        final_answer = plot_markdown + "\n\n---\n\n" + explanation

    # Convert Automata <mermaid> tags to standard markdown code blocks
    mermaid_match = re.search(r"<mermaid>(.*?)</mermaid>", explanation, re.DOTALL | re.IGNORECASE)
    if mermaid_match:
        mermaid_code = mermaid_match.group(1).strip()
        # Remove the original <mermaid> block from the explanation text
        explanation_clean = re.sub(r"<mermaid>.*?</mermaid>", "", explanation, flags=re.DOTALL | re.IGNORECASE).strip()
        final_answer = f"```mermaid\n{mermaid_code}\n```\n\n---\n\n" + explanation_clean
        
    return {"visualization": None, "status": "completed", "final_answer": final_answer}

def build_pipeline():
    """Builds the linear LangGraph deterministic pipeline."""
    builder = StateGraph(PipelineState)
    
    builder.add_node("vision", vision_node)
    builder.add_node("intent", intent_node)
    builder.add_node("builder", builder_node)
    builder.add_node("solver", solver_node)
    builder.add_node("verifier", verifier_node)
    builder.add_node("explanation", explanation_node)
    builder.add_node("visualization", visualization_node)
    
    builder.set_entry_point("vision")
    
    def check_vision_skip(s: PipelineState):
        if s.get("status") == "completed":
            return END
        return "intent"
        
    builder.add_conditional_edges("vision", check_vision_skip)
    builder.add_edge("intent", "builder")
    builder.add_edge("builder", "solver")
    builder.add_edge("solver", "verifier")
    
    # Mandatory conditional exit if verification fails
    def check_verified(s: PipelineState):
        if not s.get("verified", False):
            return END
        return "explanation"
        
    builder.add_conditional_edges("verifier", check_verified)
    builder.add_edge("explanation", "visualization")
    builder.add_edge("visualization", END)
    
    return builder.compile()
