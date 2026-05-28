import asyncio
from typing import Any, Dict, List, Optional

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from core.config import config


def _is_rate_limit_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return 'rate limit' in text or '429' in text or 'quota' in text or 'too many' in text


def _build_groq_model(model: str, temperature: float, max_tokens: int) -> Any:
    llm = ChatGroq(
        model=model,
        temperature=temperature,
        api_key=config.GROQ_API_KEY,
    )
    fallbacks = []
    if config.GROQ_API_KEY1:
        fallbacks.append(ChatGroq(model=model, temperature=temperature, api_key=config.GROQ_API_KEY1))
    if config.GROQ_API_KEY2:
        fallbacks.append(ChatGroq(model=model, temperature=temperature, api_key=config.GROQ_API_KEY2))
    return llm.with_fallbacks(fallbacks) if fallbacks else llm


class GeminiWithGroqFallback:
    def __init__(self, temperature: float = 0.0, max_tokens: int = 4096):
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.groq = _build_groq_model('llama-3.3-70b-versatile', temperature, max_tokens)
        
        self.gemini_enabled = bool(config.GOOGLE_API_KEY)
        if self.gemini_enabled:
            self.gemini = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                temperature=temperature,
                google_api_key=config.GOOGLE_API_KEY
            )
        else:
            self.gemini = None

    async def ainvoke(self, messages: List[Any], attachments: Optional[List[Dict[str, Any]]] = None) -> Any:
        prepared_messages = list(messages)
        
        if attachments:
            content = []
            for att in attachments:
                if att.get('type') == 'image' and att.get('data'):
                    content.append({
                        "type": "image_url",
                        "image_url": {"url": att['data']}
                    })
                elif att.get('type') == 'file' and att.get('name'):
                    content.append({
                        "type": "text",
                        "text": f"Attached file: {att['name']}"
                    })
            if content:
                # Merge into the last message if it's a HumanMessage, creating a NEW object
                last_msg = prepared_messages[-1] if prepared_messages else None
                if isinstance(last_msg, HumanMessage):
                    new_content = []
                    if isinstance(last_msg.content, str):
                        new_content = [{"type": "text", "text": last_msg.content}] + content
                    elif isinstance(last_msg.content, list):
                        new_content = list(last_msg.content) + content
                    prepared_messages[-1] = HumanMessage(content=new_content)
                else:
                    prepared_messages.append(HumanMessage(content=content))

        if self.gemini_enabled and self.gemini:
            try:
                # Try Gemini directly. 
                return await self.gemini.ainvoke(prepared_messages)
            except Exception as exc:
                print(f"[LLM Fallback] Gemini failed with error: {exc}. Falling back to Groq.")
                # Fallback to Groq using the ORIGINAL text-only messages to avoid "content must be a string" crash.
                return await self.groq.ainvoke(messages)
        
        return await self.groq.ainvoke(messages)


def get_llm_fast():
    """Fast model for small intent or extraction tasks."""
    return GeminiWithGroqFallback(temperature=0.0, max_tokens=256)


def get_llm_reasoning(temperature: float = 0.0):
    """Primary reasoning model, Gemini first; Groq fallback on rate limit."""
    return GeminiWithGroqFallback(temperature=temperature, max_tokens=4096)
