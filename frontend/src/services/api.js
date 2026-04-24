const API_BASE = "http://localhost:8000/api";

// Helper function
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.warn(`API connection failed: ${endpoint}`);
    return null;
  }
}

// =================== CHAT / AI ===================

export async function sendChatMessage(message, sessionId = "default", userHistory = "") {
  const result = await apiFetch("/chat", {
    method: "POST",
    body: JSON.stringify({ message, session_id: sessionId, user_history: userHistory }),
  });

  if (!result) {
    // Offline fallback — respond with helpful mock
    return {
      response: offlineFallback(message),
      suggestions: ["📋 View Menu", "⚡ Quick Picks", "💰 Budget Options"],
    };
  }
  return result;
}

function offlineFallback(message) {
  const msg = message.toLowerCase();
  if (msg.includes("menu") || msg.includes("food")) {
    return "📋 We have 20+ items! Try our bestsellers: Chicken Biryani (₹120), Paneer Butter Masala (₹90), or Masala Dosa (₹45). Browse the full menu on the Student Portal!";
  }
  if (msg.includes("under") || msg.includes("budget") || msg.includes("cheap")) {
    return "💰 Budget-friendly picks: Samosa (₹20), Masala Chai (₹15), Idli Sambhar (₹30), Vada Pav (₹20). All under ₹50!";
  }
  if (msg.includes("quick") || msg.includes("fast") || msg.includes("hurry")) {
    return "⚡ Fastest items (ready in 3-4 min): Masala Chai ☕, Samosa, Vada Pav, Fresh Lime Soda. Order from Quick Picks!";
  }
  if (msg.includes("healthy") || msg.includes("diet") || msg.includes("protein")) {
    return "🥗 Healthy options: Paneer Tikka (high protein), Idli Sambhar (low calorie), Fresh Juice (vitamins). Check the Healthy tag on menu items!";
  }
  if (msg.includes("table") || msg.includes("seat") || msg.includes("book")) {
    return "🪑 You can book a table from the 'Book a Table' section! We have window, center, and counter seating zones.";
  }
  if (msg.includes("wait") || msg.includes("queue") || msg.includes("time")) {
    return "⏱️ Current estimated wait time is ~5-10 minutes. Place your order to get a more accurate estimate!";
  }
  return "I'm currently offline 😴. But I can still help! Try asking about our menu items, prices, or wait times.";
}

// =================== QUEUE ===================

export async function getQueueStatus() {
  const result = await apiFetch("/queue-status");
  return result || { queue_length: 0, estimated_wait_minutes: 5, active_stations: 3 };
}

// =================== RECOMMENDATIONS ===================

export async function getRecommendations(filters = {}) {
  const result = await apiFetch("/recommend", {
    method: "POST",
    body: JSON.stringify(filters),
  });
  return result || { recommendations: [] };
}

// =================== ORDERS / INVENTORY ===================

export async function getMenu() {
  const result = await apiFetch("/menu");
  return result || { menu: [] };
}

export async function getInventory() {
  const result = await apiFetch("/inventory");
  return result || { inventory: [] };
}

export async function updateItemAvailability(itemId, isAvailable) {
  const result = await apiFetch(`/inventory/${itemId}/availability?is_available=${isAvailable}`, {
    method: "PUT",
  });
  return result;
}

export async function placeOrder(orderData) {
  const result = await apiFetch("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
  return result;
}

export async function getOrders() {
  const result = await apiFetch("/orders");
  return result || { orders: [] };
}

export async function updateOrderStatus(orderId, status) {
  const result = await apiFetch(`/orders/${orderId}/status?status=${status}`, {
    method: "PUT",
  });
  return result;
}

// =================== TABLES ===================

export async function getTables() {
  const result = await apiFetch("/tables");
  return result || { tables: [] };
}

export async function updateTableStatus(tableId, status) {
  const result = await apiFetch(`/tables/${tableId}/status?status=${status}`, {
    method: "PUT",
  });
  return result;
}

export async function getTableSuggestion(members) {
  const result = await apiFetch(`/tables/suggest?members=${members}`);
  return result || { suggestion: null, message: null };
}

export async function bookTable(bookingData) {
  const result = await apiFetch("/tables/book", {
    method: "POST",
    body: JSON.stringify(bookingData),
  });
  return result;
}

export async function getBookings(all = false) {
  const endpoint = all ? "/tables/bookings/all" : "/tables/bookings";
  const result = await apiFetch(endpoint);
  return result || { bookings: [] };
}

export async function cancelBooking(bookingId) {
  const result = await apiFetch(`/tables/bookings/${bookingId}`, {
    method: "DELETE",
  });
  return result;
}
