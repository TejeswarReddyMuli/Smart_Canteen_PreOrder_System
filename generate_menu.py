import json
import random

categories = {
    "Breakfast": {
        "veg": ["Idli", "Vada", "Masala Dosa", "Plain Dosa", "Upma", "Poha", "Aloo Paratha", "Paneer Paratha", "Puri Sabji", "Chole Bhature", "Uttapam", "Pongal", "Medu Vada", "Rava Dosa", "Onion Dosa", "Cheese Dosa"],
        "nonveg": ["Egg Dosa", "Egg Bhurji", "Omelette", "Chicken Sausage", "Boiled Eggs"]
    },
    "Lunch": {
        "veg": ["Veg Biryani", "Paneer Butter Masala", "Dal Makhani", "Rajma Chawal", "Kadhai Paneer", "Mix Veg", "Palak Paneer", "Aloo Gobi", "Bhindi Masala", "Malai Kofta", "Matar Paneer", "Jeera Rice", "Veg Pulao", "Naan", "Roti", "Garlic Naan", "Veg Thali", "Curd Rice", "Lemon Rice", "Sambar Rice", "Rasam Rice", "Dal Tadka", "Dum Aloo"],
        "nonveg": ["Chicken Biryani", "Mutton Biryani", "Butter Chicken", "Chicken Curry", "Fish Curry", "Egg Curry", "Chicken Tikka Masala", "Mutton Rogan Josh"]
    },
    "Chinese": {
        "veg": ["Veg Fried Rice", "Veg Noodles", "Hakka Noodles", "Chilli Paneer", "Veg Manchurian", "Gobi Manchurian", "Spring Roll", "Chilli Potato", "Mushroom Chilli", "Veg Sweet Corn Soup"],
        "nonveg": ["Chicken Fried Rice", "Chicken Noodles", "Chilli Chicken", "Chicken Manchurian", "Chicken Lollipop", "Dragon Chicken"]
    },
    "Snacks": {
        "veg": ["Samosa", "Kachori", "Pav Bhaji", "Vada Pav", "Pani Puri", "Bhel Puri", "Aloo Tikki", "Dabeli", "Veg Burger", "Cheese Burger", "Veg Pizza", "Margherita Pizza", "French Fries", "Peri Peri Fries", "Veg Sandwich", "Cheese Sandwich"],
        "nonveg": ["Chicken Burger", "Chicken Pizza", "Chicken Sandwich", "Chicken Nuggets", "Chicken Wings"]
    },
    "Beverages": {
        "veg": ["Tea", "Coffee", "Cold Coffee", "Lemon Tea", "Green Tea", "Lassi", "Mango Lassi", "Butter Milk", "Fresh Lime Soda", "Orange Juice", "Apple Juice", "Watermelon Juice", "Pineapple Juice", "Oreo Shake", "Chocolate Shake", "Strawberry Shake", "Vanilla Shake", "Badam Milk", "Rose Milk", "Soft Drink"],
        "nonveg": []
    },
    "Desserts": {
        "veg": ["Gulab Jamun", "Rasgulla", "Rasmalai", "Kheer", "Gajar Halwa", "Ice Cream", "Chocolate Brownie", "Fruit Salad", "Falooda", "Jalebi", "Rabri", "Kulfi", "Pastry", "Cupcake", "Donut"],
        "nonveg": []
    }
}

emojis = {"Breakfast": "🌅", "Lunch": "🍱", "Chinese": "🍜", "Snacks": "🍔", "Beverages": "🥤", "Desserts": "🍰"}

items = []
item_id = 1

for cat, types in categories.items():
    for veg_type, names in types.items():
        is_veg = veg_type == "veg"
        for name in names:
            price = random.randint(3, 20) * 10
            if "Biryani" in name or "Pizza" in name: price += 100
            if cat == "Beverages" or cat == "Desserts": price = random.randint(2, 10) * 10
            
            items.append({
                "id": item_id,
                "name": name,
                "category": cat,
                "price": price,
                "prepTime": random.randint(5, 20),
                "description": f"Delicious {name} prepared fresh.",
                "rating": round(random.uniform(3.8, 4.9), 1),
                "isAvailable": True,
                "stock": random.randint(10, 50),
                "emoji": emojis[cat],
                "image": f"/images/menu/{name.lower().replace(' ', '-')}.jpg",
                "isVeg": is_veg
            })
            item_id += 1

menu_data = {
    "menu_items": items,
    "canteen_info": {
        "name": "Smart Canteen",
        "location": "Main Campus, Block A",
        "opening_hours": "08:00 AM - 08:00 PM",
        "active_cooking_stations": 4
    }
}

with open("backend/data/menu_knowledge.json", "w", encoding="utf-8") as f:
    json.dump(menu_data, f, indent=2)

with open("frontend/src/data/mockData.js", "r", encoding="utf-8") as f:
    content = f.read()

import re
replacement_str = f'export const menuItems = {json.dumps(items, indent=2)};'
new_content = re.sub(r'export const menuItems = \[.*?\];', lambda m: replacement_str, content, flags=re.DOTALL)

# Update categories
new_categories = 'export const categories = ["All", "Breakfast", "Lunch", "Chinese", "Snacks", "Beverages", "Desserts"];'
new_content = re.sub(r'export const categories = \[.*?\];', new_categories, new_content)

new_emojis = '''export const categoryEmojis = {
  All: "🍽️",
  Breakfast: "🌅",
  Lunch: "🍱",
  Chinese: "🍜",
  Snacks: "🍿",
  Beverages: "🥤",
  Desserts: "🍰",
};'''
new_content = re.sub(r'export const categoryEmojis = \{.*?};', new_emojis, new_content, flags=re.DOTALL)


with open("frontend/src/data/mockData.js", "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Generated {len(items)} items!")
