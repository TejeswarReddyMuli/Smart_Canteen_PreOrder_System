import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  FaUtensils,
  FaRobot,
  FaClock,
  FaBrain,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaStar,
  FaBolt,
  FaLeaf,
} from "react-icons/fa";
import { menuItems } from "../data/mockData";
import "./Landing.css";

const studentCards = [
  {
    id: "student",
    title: "Order Food",
    subtitle: "Browse menu, cart and AI chatbot",
    path: "/student",
    gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
    emoji: "Tray",
  },
  {
    id: "booking",
    title: "Book a Table",
    subtitle: "Interactive floor plan and seat selection",
    path: "/booking",
    gradient: "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)",
    emoji: "Seat",
  },
];

const managerCards = [
  {
    id: "manager",
    title: "Manager Dashboard",
    subtitle: "Live orders, stock and table control",
    path: "/manager",
    gradient: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
    emoji: "Ops",
  },
  {
    id: "analytics",
    title: "Analytics",
    subtitle: "Reports, charts and demand signals",
    path: "/analytics",
    gradient: "linear-gradient(135deg, #059669 0%, #34d399 100%)",
    emoji: "Data",
  },
];

const features = [
  { icon: <FaRobot />, title: "AI-Powered", desc: "LangChain plus RAG for smart recommendations" },
  { icon: <FaClock />, title: "Queue Prediction", desc: "Real-time wait time estimation" },
  { icon: <FaBrain />, title: "Agentic AI", desc: "Groq-powered conversational ordering" },
  { icon: <FaUtensils />, title: "Smart Menu", desc: "Personalized food suggestions" },
];

const todaySpecials = [...menuItems]
  .filter((item) => item.isAvailable)
  .sort((a, b) => (b.rating || 0) - (a.rating || 0))
  .slice(0, 3);

export default function Landing() {
  const navigate = useNavigate();
  const { currentUser, userRole, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const userName = sessionStorage.getItem("userName") || currentUser?.email?.split("@")[0] || "User";
  const cards = userRole === "manager" ? managerCards : studentCards;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="landing-page">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <div className="floating-image floating-image-1">
        <img src="/images/menu/chicken-biryani.jpg" alt="Chicken Biryani" />
      </div>
      <div className="floating-image floating-image-2">
        <img src="/images/menu/masala-dosa.jpg" alt="Masala Dosa" />
      </div>
      <div className="floating-image floating-image-3">
        <img src="/images/menu/oreo-shake.jpg" alt="Oreo Shake" />
      </div>

      <div className="landing-top-bar">
        <span className="welcome-badge">
          {userRole === "manager" ? "Manager" : "Hello"}, {userName}
          <span className="role-badge">{userRole}</span>
        </span>
        <div className="top-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
            {isDark ? <FaSun /> : <FaMoon />}
          </button>
          <button className="btn btn-secondary btn-sm logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      <header className="landing-hero">
        <div className="hero-badge">
          <FaRobot /> Powered by Agentic AI
        </div>
        <h1 className="hero-title">
          <span className="gradient-text">Smart Canteen</span>
        </h1>
        <p className="hero-subtitle">AI-Powered • Zero Wait • Smart Dining</p>
        <p className="hero-desc">
          Pre-order meals, book tables, and get AI-powered food recommendations in one smooth campus flow.
        </p>

        <div className="hero-metrics">
          <div className="hero-metric glass">
            <span>Live Queue</span>
            <strong>5-10 min</strong>
          </div>
          <div className="hero-metric glass">
            <span>Pickup Flow</span>
            <strong>Quick Counter</strong>
          </div>
          <div className="hero-metric glass">
            <span>Today</span>
            <strong>Fresh Specials</strong>
          </div>
        </div>
      </header>

      <section className="specials-section">
        <div className="specials-heading">
          <div>
            <p className="specials-kicker">Today&apos;s Special</p>
            <h2 className="section-title">Fresh picks worth opening first</h2>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/student")}>
            <FaBolt /> Order Now
          </button>
        </div>

        <div className="specials-grid">
          {todaySpecials.map((item, index) => (
            <article key={item.id} className="special-card glass" style={{ animationDelay: `${index * 0.08}s` }}>
              <div className="special-image-wrap">
                <img src={item.image} alt={item.name} className="special-image" />
                <span className="special-tag">{item.category}</span>
              </div>
              <div className="special-copy">
                <div className="special-title-row">
                  <h3>{item.name}</h3>
                  <span className={`special-diet ${item.isVeg ? "veg" : "non-veg"}`}>
                    {item.isVeg ? <FaLeaf /> : <FaUtensils />}
                  </span>
                </div>
                <p>{item.description}</p>
                <div className="special-meta">
                  <span><FaStar /> {item.rating}</span>
                  <span><FaClock /> {item.prepTime} min</span>
                  <strong>Rs {item.price}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cards" style={{ gridTemplateColumns: `repeat(${cards.length}, 1fr)` }}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="landing-card"
            id={`card-${card.id}`}
            onClick={() => navigate(card.path)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="landing-card-icon" style={{ background: card.gradient }}>
              <span className="card-emoji">{card.emoji}</span>
            </div>
            <h3 className="landing-card-title">{card.title}</h3>
            <p className="landing-card-subtitle">{card.subtitle}</p>
            <div className="landing-card-arrow">→</div>
          </div>
        ))}
      </section>

      <section className="landing-features">
        <h2 className="section-title landing-center-title">Key Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-item" style={{ animationDelay: `${index * 0.1 + 0.4}s` }}>
              <div className="feature-icon">{feature.icon}</div>
              <h4>{feature.title}</h4>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <p>Built for Agentic AI Hackathon 2026</p>
        <p className="footer-tech">React • FastAPI • LangChain • RAG • Groq • ChromaDB • Firebase</p>
      </footer>
    </div>
  );
}
