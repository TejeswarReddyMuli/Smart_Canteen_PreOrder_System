from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    user_history: Optional[str] = ""


class ChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []


class RecommendRequest(BaseModel):
    budget: Optional[int] = None
    taste: Optional[str] = None
    dietary: Optional[str] = None
    urgency: Optional[str] = None


class OrderItem(BaseModel):
    item_id: int
    item_name: str
    quantity: int
    price: float


class PlaceOrderRequest(BaseModel):
    student_name: str
    items: List[OrderItem]


class TableBookingRequest(BaseModel):
    student_name: str
    table_id: int
    date: str
    time_slot: str
    members: int
