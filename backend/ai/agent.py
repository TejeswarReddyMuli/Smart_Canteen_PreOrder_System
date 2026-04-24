import json
import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from config import GROQ_API_KEY, GROQ_MODEL, GROQ_TEMPERATURE
from ai.rag import get_retriever
from ai.prompts import SYSTEM_PROMPT

# In-memory data for demo
order_queue = []
menu_items = []
canteen_info = {}

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_initial_data():
    """Load menu data from JSON once at startup."""
    global menu_items, canteen_info
    menu_path = os.path.join(DATA_DIR, "menu_knowledge.json")
    with open(menu_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        menu_items = data["menu_items"]
        canteen_info = data["canteen_info"]


def get_menu_data():
    """Get the current in-memory menu data."""
    if not menu_items:
        load_initial_data()
    return {
        "menu_items": menu_items,
        "canteen_info": canteen_info
    }


def get_queue_status():
    """Calculate current queue wait time."""
    menu_data = get_menu_data()
    items_map = {item["id"]: item for item in menu_data["menu_items"]}
    active_stations = menu_data["canteen_info"]["active_cooking_stations"]

    total_prep_time = 0
    for order in order_queue:
        if order.get("status") in ["placed", "preparing"]:
            for item in order.get("items", []):
                menu_item = items_map.get(item.get("item_id"))
                if menu_item:
                    total_prep_time += menu_item["prepTime"] * item.get("quantity", 1)

    estimated_wait = max(0, total_prep_time // active_stations)
    return {
        "queue_length": len([o for o in order_queue if o.get("status") in ["placed", "preparing"]]),
        "estimated_wait_minutes": estimated_wait,
        "active_stations": active_stations
    }


def format_docs(docs):
    """Format retrieved documents into a single string."""
    return "\n\n".join(doc.page_content for doc in docs)


def create_chain():
    """Create the LangChain RAG chain with Groq."""
    llm = ChatGroq(
        api_key=GROQ_API_KEY,
        model_name=GROQ_MODEL,
        temperature=GROQ_TEMPERATURE,
    )

    retriever = get_retriever()

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT + "\n\nContext from menu knowledge base:\n{context}"),
        ("human", "{question}")
    ])

    # Modern LCEL chain
    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain


# Singleton chain instance
_chain = None


def get_chain():
    """Get or create the singleton chain."""
    global _chain
    if _chain is None:
        _chain = create_chain()
    return _chain


async def chat_with_agent(message: str, user_history: str = "") -> dict:
    """Process a chat message through the LangChain RAG chain."""
    chain = get_chain()

    # Enhance message with queue and history context
    queue = get_queue_status()
    enhanced_message = f"{message}\n\n[Current Queue: {queue['queue_length']} orders, ~{queue['estimated_wait_minutes']} min wait]"
    if user_history:
        enhanced_message += f"\n[User's Past Orders (for personalization): {user_history}]"

    try:
        response_text = chain.invoke(enhanced_message)
    except Exception as e:
        response_text = f"I'm having a moment 😅. Let me try again! (Error: {str(e)[:100]})"

    # Generate quick action suggestions based on the conversation
    suggestions = generate_suggestions(message)

    return {
        "response": response_text,
        "suggestions": suggestions
    }


def generate_suggestions(message: str) -> list:
    """Generate contextual quick-action suggestions."""
    message_lower = message.lower()

    if any(word in message_lower for word in ["hungry", "eat", "food", "meal"]):
        return ["🔥 Today's Special", "⚡ Quick Picks", "💰 Under ₹50"]
    elif any(word in message_lower for word in ["drink", "thirsty", "beverage"]):
        return ["☕ Hot Drinks", "🧊 Cold Drinks", "🥤 Fresh Juice"]
    elif any(word in message_lower for word in ["healthy", "diet", "calories", "protein"]):
        return ["🥗 Low Calorie", "💪 High Protein", "🌿 Vegan Options"]
    elif any(word in message_lower for word in ["fast", "quick", "hurry", "rush"]):
        return ["⚡ Ready in 3 min", "🏃 Grab & Go", "📊 Queue Status"]
    elif any(word in message_lower for word in ["table", "seat", "sit"]):
        return ["🪑 Book a Table", "👥 Group Seating", "🪟 Window Seats"]
    else:
        return ["📋 Full Menu", "⚡ Quick Picks", "💬 Surprise Me!"]


async def get_smart_recommendations(budget=None, taste=None, dietary=None, urgency=None) -> list:
    """Get smart food recommendations based on preferences."""
    menu_data = get_menu_data()
    items = menu_data["menu_items"]
    queue = get_queue_status()

    # Filter items based on preferences
    filtered = [i for i in items if i["isAvailable"] and i["stock"] > 0]

    if budget:
        filtered = [i for i in filtered if i["price"] <= budget]

    if dietary:
        dietary_lower = dietary.lower()
        if dietary_lower in ["veg", "vegetarian"]:
            filtered = [i for i in filtered if "vegetarian" in i["tags"]]
        elif dietary_lower in ["non-veg", "non-vegetarian"]:
            filtered = [i for i in filtered if "non-veg" in i["tags"]]
        elif dietary_lower == "healthy":
            filtered = [i for i in filtered if "healthy" in i["tags"]]

    if taste:
        taste_lower = taste.lower()
        filtered = [i for i in filtered if taste_lower in [t.lower() for t in i["tags"]]]

    if urgency and urgency.lower() in ["fast", "quick", "urgent"]:
        filtered = [i for i in filtered if i["prepTime"] <= 5]

    # Sort by rating
    filtered.sort(key=lambda x: x["rating"], reverse=True)

    # Return top 3
    recommendations = []
    for item in filtered[:3]:
        wait_time = item["prepTime"] + queue["estimated_wait_minutes"]
        recommendations.append({
            "id": item["id"],
            "name": item["name"],
            "price": item["price"],
            "prepTime": item["prepTime"],
            "totalWait": wait_time,
            "rating": item["rating"],
            "calories": item["nutrition"]["calories"],
            "reason": f"Rated {item['rating']}⭐ by students. {item['description'][:60]}..."
        })

    return recommendations
