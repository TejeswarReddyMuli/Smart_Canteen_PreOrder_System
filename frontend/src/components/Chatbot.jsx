import { useState, useRef, useEffect } from "react";
import { FaRobot, FaTimes, FaPaperPlane } from "react-icons/fa";
import { sendChatMessage } from "../services/api";
import "./Chatbot.css";

const quickActions = [
  "⚡ What's fastest?",
  "💰 Under ₹50",
  "🥗 Healthy options",
  "🔥 Today's special",
  "⏱️ Queue status",
  "🎲 Surprise me!",
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hey there! 👋 I'm CanteeBot 🤖\n\nI can help you find the perfect meal, check wait times, or suggest something based on your mood!\n\nTry asking me anything!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      let pastOrders = [];
      try {
        const saved = sessionStorage.getItem("canteen_orders");
        pastOrders = saved && saved !== "undefined" ? JSON.parse(saved) : [];
        if (!Array.isArray(pastOrders)) pastOrders = [];
      } catch { pastOrders = []; }
      
      const historyStr = pastOrders.map(o => (o.items || []).map(i => i.item_name).join(", ")).join(" | ");
      
      const result = await sendChatMessage(text, "default", historyStr);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: result.response, suggestions: result.suggestions },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Oops! Something went wrong 😅. Try again?" },
      ]);
    }

    setIsTyping(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button className="chatbot-fab" onClick={() => setIsOpen(true)} id="chatbot-toggle">
          <FaRobot />
          <span className="fab-pulse"></span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🤖</div>
              <div>
                <h4>CanteeBot</h4>
                <span className="chatbot-status">● Online — Powered by Groq</span>
              </div>
            </div>
            <button className="btn-icon" onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                {msg.role === "bot" && <span className="chat-avatar">🤖</span>}
                <div className="chat-bubble">
                  <p style={{ whiteSpace: "pre-line" }}>{msg.text}</p>
                  {msg.suggestions && (
                    <div className="chat-suggestions">
                      {msg.suggestions.map((s, j) => (
                        <button key={j} className="chip" onClick={() => sendMessage(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-message bot">
                <span className="chat-avatar">🤖</span>
                <div className="chat-bubble typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="chatbot-quick-actions">
            {quickActions.map((action, i) => (
              <button key={i} className="chip" onClick={() => sendMessage(action)}>
                {action}
              </button>
            ))}
          </div>

          {/* Input */}
          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input
              type="text"
              className="input"
              placeholder="Ask CanteeBot anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              id="chatbot-input"
            />
            <button type="submit" className="btn btn-primary" id="chatbot-send">
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
