from fastapi import APIRouter
from models import ChatRequest, ChatResponse
from ai.agent import chat_with_agent

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """AI Chatbot endpoint — processes student messages through LangChain agent with RAG."""
    result = await chat_with_agent(request.message, request.user_history)
    return ChatResponse(
        response=result["response"],
        suggestions=result["suggestions"]
    )
