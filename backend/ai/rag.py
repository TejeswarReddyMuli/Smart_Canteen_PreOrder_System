import json
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_menu_documents():
    """Load menu data and convert to documents for RAG."""
    menu_path = os.path.join(DATA_DIR, "menu_knowledge.json")
    with open(menu_path, "r") as f:
        data = json.load(f)

    documents = []

    # Create a document for each menu item
    for item in data["menu_items"]:
        nutrition = item.get('nutrition', {'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0})
        tags = item.get('tags', [])
        allergens = item.get('allergens', [])
        orders_month = item.get('ordersThisMonth', 0)
        
        doc = f"""Menu Item: {item['name']}
Category: {item['category']}
Price: ₹{item['price']}
Preparation Time: {item['prepTime']} minutes
Description: {item.get('description', '')}
Nutrition: {nutrition.get('calories', 0)} calories, {nutrition.get('protein', 0)}g protein, {nutrition.get('carbs', 0)}g carbs, {nutrition.get('fat', 0)}g fat
Tags: {', '.join(tags)}
Allergens: {', '.join(allergens) if allergens else 'None'}
Student Rating: {item.get('rating', 4.0)}/5
Monthly Orders: {orders_month}
Available: {'Yes' if item.get('isAvailable', True) else 'No'}
Stock Remaining: {item.get('stock', 0)}"""
        documents.append(doc)

    # Add canteen info
    info = data.get("canteen_info", {})
    canteen_doc = f"""Canteen Name: {info.get('name', 'Smart Canteen')}
Operating Hours: {info.get('operating_hours', '08:00 AM - 08:00 PM')}
Seating Capacity: {info.get('seating_capacity', 100)} people
Number of Tables: {info.get('number_of_tables', 20)}
Active Cooking Stations: {info.get('active_cooking_stations', 4)}
Policies: {' | '.join(info.get('policies', []))}"""
    documents.append(canteen_doc)

    return documents


def create_vectorstore():
    """Create or load the ChromaDB vector store with menu knowledge."""
    documents = load_menu_documents()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = text_splitter.create_documents(documents)

    # Use a lightweight local embedding model (no API key needed)
    embeddings = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"}
    )

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_PERSIST_DIR
    )

    return vectorstore


def get_retriever():
    """Get or create the RAG retriever."""
    embeddings = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"}
    )

    # Try to load existing vectorstore
    if os.path.exists(CHROMA_PERSIST_DIR):
        try:
            vectorstore = Chroma(
                persist_directory=CHROMA_PERSIST_DIR,
                embedding_function=embeddings
            )
            # Check if it has documents
            if vectorstore._collection.count() > 0:
                return vectorstore.as_retriever(search_kwargs={"k": 5})
        except Exception:
            pass

    # Create new vectorstore
    vectorstore = create_vectorstore()
    return vectorstore.as_retriever(search_kwargs={"k": 5})
