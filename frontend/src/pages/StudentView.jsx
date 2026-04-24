import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  FaShoppingCart,
  FaArrowLeft,
  FaBell,
  FaWallet,
  FaMinus,
  FaPlus,
  FaTimes,
  FaStar,
  FaBolt,
  FaClock,
  FaMoon,
  FaSun,
  FaCheck,
  FaCreditCard,
  FaMoneyBillWave,
  FaMobileAlt,
  FaSearch,
  FaHeart,
  FaRegHeart,
  FaHistory,
  FaEllipsisV,
  FaUtensils,
  FaClipboardList,
  FaFire,
  FaReceipt,
  FaLeaf,
} from "react-icons/fa";
import { menuItems, categories, categoryEmojis } from "../data/mockData";
import { getQueueStatus, placeOrder as placeOrderAPI, getMenu, getOrders } from "../services/api";
import Chatbot from "../components/Chatbot";
import "./StudentView.css";

export default function StudentView() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const menuSectionRef = useRef(null);

  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [showOrdersPanel, setShowOrdersPanel] = useState(false);
  const [paymentMode, setPaymentMode] = useState("upi");
  const [queueStatus, setQueueStatus] = useState({ queue_length: 0, estimated_wait_minutes: 5 });
  const [menuItemsList, setMenuItemsList] = useState(menuItems);
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const userName = sessionStorage.getItem("userName") || "Student";

  const [orderPlaced, setOrderPlaced] = useState(() => {
    try {
      const saved = sessionStorage.getItem("active_order_tracking");
      return saved && saved !== "undefined" ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(`favorites_${userName}`);
      const parsed = saved && saved !== "undefined" ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  let pastOrders = [];
  try {
    const saved = sessionStorage.getItem("canteen_orders");
    pastOrders = saved && saved !== "undefined" ? JSON.parse(saved) : [];
    if (!Array.isArray(pastOrders)) pastOrders = [];
  } catch {
    pastOrders = [];
  }

  useEffect(() => {
    localStorage.setItem(`favorites_${userName}`, JSON.stringify(favorites));
  }, [favorites, userName]);

  useEffect(() => {
    if (orderPlaced) {
      sessionStorage.setItem("active_order_tracking", JSON.stringify(orderPlaced));
    } else {
      sessionStorage.removeItem("active_order_tracking");
    }
  }, [orderPlaced]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const result = await getMenu();
        if (result && Array.isArray(result.menu) && result.menu.length > 0) {
          setMenuItemsList(result.menu);
        }
      } catch (error) {
        console.error("Failed to fetch menu", error);
      }
    };

    getQueueStatus().then(setQueueStatus);
    fetchMenu();

    const interval = setInterval(() => {
      getQueueStatus().then(setQueueStatus);
      fetchMenu();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!orderPlaced || orderPlaced.status === "completed") return;

    const interval = setInterval(async () => {
      try {
        const result = await getOrders();
        if (!result || !result.orders) return;

        const myOrder = result.orders.find((order) => order.id === orderPlaced.id);
        if (myOrder && myOrder.status !== orderPlaced.status) {
          setOrderPlaced((prev) => ({ ...prev, status: myOrder.status }));

          const newNotification = {
            id: Date.now(),
            text: `Order ${myOrder.id} is now ${myOrder.status.toUpperCase()}.`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            type: myOrder.status === "ready" ? "success" : "info",
          };

          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          showToast(newNotification.text, newNotification.type);
        }
      } catch (error) {
        console.error("Status poll failed", error);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [orderPlaced]);

  let filteredItemsList = menuItemsList;

  if (activeCategory === "Favorites") {
    filteredItemsList = filteredItemsList.filter((item) => favorites.includes(item?.id));
  } else if (activeCategory !== "All") {
    filteredItemsList = filteredItemsList.filter((item) => item?.category === activeCategory);
  }

  if (vegOnly) {
    filteredItemsList = filteredItemsList.filter((item) => item?.isVeg);
  }

  if (searchQuery.trim()) {
    filteredItemsList = filteredItemsList.filter((item) =>
      item?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleFavorite = (event, id) => {
    event.stopPropagation();
    setFavorites((prev) => (prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]));
  };

  const addToCart = (item) => {
    if (!item.isAvailable) {
      showToast(`Sorry, ${item.name} is currently out of stock.`, "warning");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id);
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });

    showToast(`${item.name} added to cart.`, "success");
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartWaitTime =
    cart.length > 0 ? Math.max(...cart.map((item) => item.prepTime)) + (queueStatus?.estimated_wait_minutes || 0) : 0;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    const orderData = {
      student_name: userName,
      payment_mode: paymentMode,
      items: cart.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    let orderId = `ORD-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const result = await placeOrderAPI(orderData);
      if (result && result.order) {
        orderId = result.order.id;
      }
    } catch (error) {
      console.log("Backend offline, order saved locally");
    }

    const localOrder = {
      id: orderId,
      student_name: userName,
      items: cart.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        emoji: item.emoji,
        quantity: item.quantity,
        price: item.price,
      })),
      total: cartTotal,
      payment_mode: paymentMode,
      status: "placed",
      placed_at: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
      estimated_ready: `~${cartWaitTime} min`,
    };

    const existingOrders = JSON.parse(sessionStorage.getItem("canteen_orders") || "[]");
    existingOrders.unshift(localOrder);
    sessionStorage.setItem("canteen_orders", JSON.stringify(existingOrders));

    setOrderPlaced({
      id: orderId,
      items: [...cart],
      total: cartTotal,
      status: "placed",
      waitTime: cartWaitTime,
      paymentMode,
    });
    setCart([]);
    setShowCart(false);
    showToast(`Order ${orderId} placed. Estimated wait: ${cartWaitTime} min.`, "success");
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications) setUnreadCount(0);
  };

  const handleOverflowAction = (action) => {
    setShowOverflowMenu(false);

    if (action === "menu") {
      menuSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (action === "orders") {
      setShowOrdersPanel(true);
      return;
    }

    if (action === "cart") {
      setShowCart(true);
      return;
    }

    if (action === "history") {
      setShowHistory(true);
      return;
    }

    navigate("/");
  };

  const orderStatus = orderPlaced?.status || "placed";
  const todaySpecial = [...menuItemsList]
    .filter((item) => item?.isAvailable)
    .sort((a, b) => (b?.rating || 0) - (a?.rating || 0))
    .slice(0, 1)[0];
  const recentOrdersCount = pastOrders.length;
  const favoriteCount = favorites.length;

  return (
    <div className="page-container student-page">
      {showOverflowMenu && <div className="floating-backdrop" onClick={() => setShowOverflowMenu(false)} />}

      <header className="student-header glass">
        <div className="header-left">
          <div className="overflow-menu-wrapper">
            <button className="btn-icon" onClick={() => setShowOverflowMenu((prev) => !prev)} title="Open menu">
              <FaEllipsisV />
            </button>

            {showOverflowMenu && (
              <div className="overflow-menu glass-strong animate-fadeIn">
                <button className="overflow-menu-item" onClick={() => handleOverflowAction("menu")}>
                  <FaUtensils />
                  <span>Menu</span>
                </button>
                <button className="overflow-menu-item" onClick={() => handleOverflowAction("orders")}>
                  <FaClipboardList />
                  <span>Orders</span>
                </button>
                <button className="overflow-menu-item" onClick={() => handleOverflowAction("cart")}>
                  <FaShoppingCart />
                  <span>Add to Cart</span>
                </button>
                <button className="overflow-menu-item" onClick={() => handleOverflowAction("history")}>
                  <FaHistory />
                  <span>Order History</span>
                </button>
                <button className="overflow-menu-item" onClick={() => handleOverflowAction("back")}>
                  <FaArrowLeft />
                  <span>Back</span>
                </button>
              </div>
            )}
          </div>

          <div className="student-info">
            <span className="student-name">Hi, {userName}</span>
            <span className="student-subtitle">Smart canteen user portal</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
            {isDark ? <FaSun /> : <FaMoon />}
          </button>

          <div className="notification-wrapper">
            <button className="btn-icon notification-btn" onClick={toggleNotifications}>
              <FaBell />
              {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="notifications-dropdown glass-strong animate-fadeIn">
                <div className="notif-header">
                  <h4>Notifications</h4>
                  {notifications.length > 0 && (
                    <button className="btn-text" onClick={() => setNotifications([])}>
                      Clear All
                    </button>
                  )}
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <p className="notif-empty">No new updates</p>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.id} className={`notif-item ${notification.type}`}>
                        <div className="notif-icon">{notification.type === "success" ? "OK" : "i"}</div>
                        <div className="notif-content">
                          <p>{notification.text}</p>
                          <span>{notification.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="btn-icon cart-btn" onClick={() => setShowCart(true)} title="Open cart">
            <FaShoppingCart />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      <div className="queue-banner glass">
        <div className="queue-pulse"></div>
        <FaClock className="queue-icon" />
        <span>
          About {queueStatus.estimated_wait_minutes} min wait | {queueStatus.queue_length} orders ahead
        </span>
      </div>

      <section className="student-hero glass">
        <div className="student-hero-copy">
          <p className="student-hero-kicker">Today&apos;s Special</p>
          <h2>{todaySpecial?.name || "Chef's Pick"}</h2>
          <p className="student-hero-desc">
            {todaySpecial?.description || "Freshly prepared favorites are ready for quick pickup."}
          </p>
          <div className="student-hero-meta">
            <span><FaFire /> High demand</span>
            <span><FaClock /> {todaySpecial?.prepTime || 8} min</span>
            <span>{todaySpecial?.isVeg ? <FaLeaf /> : <FaUtensils />} {todaySpecial?.isVeg ? "Veg" : "Non-veg"}</span>
          </div>
          <div className="student-hero-actions">
            <button className="btn btn-primary btn-sm" onClick={() => todaySpecial && addToCart(todaySpecial)}>
              <FaPlus /> Add Special
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => menuSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              <FaUtensils /> Browse Menu
            </button>
          </div>
        </div>

        {todaySpecial?.image && (
          <div className="student-hero-visual">
            <img src={todaySpecial.image} alt={todaySpecial.name} />
            <div className="student-special-price">Rs {todaySpecial.price}</div>
          </div>
        )}
      </section>

      <section className="student-insights">
        <article className="student-insight-card glass">
          <span className="insight-label">Cart Items</span>
          <strong>{cartCount}</strong>
          <p>Ready to check out when you are.</p>
        </article>
        <article className="student-insight-card glass">
          <span className="insight-label">Order History</span>
          <strong>{recentOrdersCount}</strong>
          <p>Previous meals saved for quick reorders.</p>
        </article>
        <article className="student-insight-card glass">
          <span className="insight-label">Favorites</span>
          <strong>{favoriteCount}</strong>
          <p>Keep your go-to dishes one tap away.</p>
        </article>
        <article className="student-insight-card glass">
          <span className="insight-label">Current Queue</span>
          <strong>{queueStatus.queue_length}</strong>
          <p>Orders ahead before your next pickup.</p>
        </article>
      </section>

      <div className="category-tabs" ref={menuSectionRef}>
        {["Favorites", ...categories].map((category) => (
          <button
            key={category}
            className={`chip ${activeCategory === category ? "active" : ""}`}
            onClick={() => setActiveCategory(category)}
          >
            {category === "Favorites" ? "Love" : categoryEmojis[category]} {category}
          </button>
        ))}
      </div>

      <div className="filters-bar animate-fadeIn">
        <div className="search-box glass">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search for biryani, dosa..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <button className={`btn-veg-toggle ${vegOnly ? "active" : ""}`} onClick={() => setVegOnly(!vegOnly)}>
          <span className="veg-dot"></span> Veg Only
        </button>
      </div>

      <div className="menu-grid">
        {filteredItemsList.length === 0 && (
          <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
            <p>No items found matching your filters.</p>
          </div>
        )}

        {filteredItemsList.length > 0 &&
          filteredItemsList.map((item, index) => (
            <div
              key={item?.id || index}
              className={`menu-card card ${!item?.isAvailable ? "unavailable" : ""}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="menu-card-image-container">
                {item?.image && typeof item.image === "string" && (
                  <img
                    src={item.image.startsWith("/") ? item.image : `/${item.image}`}
                    alt={item?.name || "Item"}
                    className="menu-card-image"
                    loading="lazy"
                  />
                )}

                <button
                  className={`btn-icon-sm btn-favorite ${favorites.includes(item?.id) ? "active" : ""}`}
                  onClick={(event) => toggleFavorite(event, item?.id)}
                >
                  {favorites.includes(item?.id) ? <FaHeart /> : <FaRegHeart />}
                </button>

                <div className="menu-card-top">
                  <span className="menu-emoji">{item?.emoji || "Food"}</span>
                  {item?.isAvailable ? (
                    item?.prepTime <= 4 && (
                      <span className="badge badge-cyan">
                        <FaBolt /> Quick
                      </span>
                    )
                  ) : (
                    <span className="badge badge-red">Out of Stock</span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className={`diet-indicator ${item?.isVeg !== false ? "veg" : "non-veg"}`}></span>
                <h3 className="menu-card-name">{item?.name || "Unknown Item"}</h3>
              </div>
              <p className="menu-card-desc">{item?.description || ""}</p>
              <div className="menu-card-meta">
                <span className="menu-price">Rs {item?.price || 0}</span>
                <span className="menu-time">
                  <FaClock /> {item?.prepTime || 5} min
                </span>
                <span className="menu-rating">
                  <FaStar /> {item?.rating || 4.0}
                </span>
              </div>
              <button
                className={`btn ${item?.isAvailable ? "btn-primary" : "btn-secondary disabled"} btn-sm menu-add-btn`}
                onClick={() => item && addToCart(item)}
                disabled={!item?.isAvailable}
              >
                {item?.isAvailable ? (
                  <>
                    <FaPlus /> Add
                  </>
                ) : (
                  "Unavailable"
                )}
              </button>
            </div>
          ))}
      </div>

      {orderPlaced && (
        <div className="order-tracking glass animate-slideInUp">
          <div className="order-tracking-header">
            <h3>Order {orderPlaced.id}</h3>
            <button className="btn-icon-sm" onClick={() => setOrderPlaced(null)}>
              <FaTimes />
            </button>
          </div>
          <div className="order-steps">
            {[
              { id: "placed", label: "Placed" },
              { id: "preparing", label: "Preparing" },
              { id: "ready", label: "Ready" },
              { id: "completed", label: "Picked Up" },
            ].map((step, index) => {
              const statusOrder = ["placed", "preparing", "ready", "completed"];
              const currentIndex = statusOrder.indexOf(orderStatus);
              const isActive = currentIndex >= index;
              const isCurrent = orderStatus === step.id;

              return (
                <div key={step.id} className={`order-step ${isActive ? "active" : ""} ${isCurrent ? "current" : ""}`}>
                  <div className="step-dot">{isActive ? <FaCheck /> : index + 1}</div>
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
          <p className="order-wait">
            {orderStatus === "ready" ? (
              <strong className="animate-pulse" style={{ color: "var(--green-light)", fontSize: "1.1rem" }}>
                Your food is ready at the counter.
              </strong>
            ) : (
              `Status: ${orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}`
            )}
          </p>
        </div>
      )}

      {showOrdersPanel && (
        <div className="cart-overlay" onClick={() => setShowOrdersPanel(false)}>
          <div className="cart-panel glass-strong" onClick={(event) => event.stopPropagation()}>
            <div className="cart-header">
              <h3>Your Orders</h3>
              <button className="btn-icon" onClick={() => setShowOrdersPanel(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="cart-items order-panel-body">
              {orderPlaced ? (
                <div className="order-summary-card">
                  <div className="order-summary-top">
                    <div>
                      <p className="order-summary-label">Active Order</p>
                      <h4>{orderPlaced.id}</h4>
                    </div>
                    <span className={`order-status-pill status-${orderStatus}`}>{orderStatus.toUpperCase()}</span>
                  </div>

                  <div className="order-summary-metrics">
                    <div>
                      <span>Status</span>
                      <strong>{orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}</strong>
                    </div>
                    <div>
                      <span>Total</span>
                      <strong>Rs {orderPlaced.total}</strong>
                    </div>
                    <div>
                      <span>Wait Time</span>
                      <strong>{orderPlaced.waitTime} min</strong>
                    </div>
                  </div>

                  <div className="order-summary-items">
                    {(orderPlaced.items || []).map((item) => (
                      <div key={item.id} className="order-summary-item">
                        <span>
                          {item.emoji} {item.name}
                        </span>
                        <strong>{item.quantity}x</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="cart-empty">No active orders right now.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-panel glass-strong" onClick={(event) => event.stopPropagation()}>
            <div className="cart-header">
              <h3>Your Cart</h3>
              <button className="btn-icon" onClick={() => setShowCart(false)}>
                <FaTimes />
              </button>
            </div>
            {cart.length === 0 ? (
              <p className="cart-empty">Your cart is empty</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-emoji">{item.emoji}</span>
                        <div>
                          <p className="cart-item-name">{item.name}</p>
                          <p className="cart-item-price">Rs {item.price}</p>
                        </div>
                      </div>
                      <div className="cart-item-qty">
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>
                          <FaMinus />
                        </button>
                        <span>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>
                          <FaPlus />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <div className="cart-summary-row">
                    <span>Total</span>
                    <span className="cart-total">Rs {cartTotal}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>Estimated Wait</span>
                    <span className="cart-wait">{cartWaitTime} min</span>
                  </div>

                  <div className="payment-section">
                    <p className="payment-label">Payment Method</p>
                    <div className="payment-options">
                      {[
                        { id: "upi", label: "UPI", icon: <FaMobileAlt />, color: "#6C5CE7" },
                        { id: "card", label: "Card", icon: <FaCreditCard />, color: "#00B894" },
                        { id: "cash", label: "Cash", icon: <FaMoneyBillWave />, color: "#FDCB6E" },
                        { id: "wallet", label: "Wallet", icon: <FaWallet />, color: "#E17055" },
                      ].map((method) => (
                        <button
                          key={method.id}
                          className={`payment-btn ${paymentMode === method.id ? "active" : ""}`}
                          onClick={() => setPaymentMode(method.id)}
                          style={
                            paymentMode === method.id
                              ? { borderColor: method.color, background: `${method.color}15` }
                              : {}
                          }
                        >
                          <span
                            className="payment-icon"
                            style={paymentMode === method.id ? { color: method.color } : {}}
                          >
                            {method.icon}
                          </span>
                          <span>{method.label}</span>
                          {paymentMode === method.id && (
                            <FaCheck className="payment-check" style={{ color: method.color }} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="btn btn-primary btn-lg cart-checkout-btn" onClick={handlePlaceOrder}>
                    Pay Rs {cartTotal} via {paymentMode.toUpperCase()}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showHistory && (
        <div className="cart-overlay" onClick={() => setShowHistory(false)}>
          <div className="cart-panel glass-strong" onClick={(event) => event.stopPropagation()}>
            <div className="cart-header">
              <h3>Order History</h3>
              <button className="btn-icon" onClick={() => setShowHistory(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="cart-items history-panel-body">
              {pastOrders.length === 0 ? (
                <p className="cart-empty">You have not placed any orders yet.</p>
              ) : (
                pastOrders.map((order, index) => (
                  <div key={index} className="card history-card">
                    <div className="history-card-header">
                      <strong>{order.id}</strong>
                      <span className="text-muted">{order.placed_at}</span>
                    </div>
                    {(order.items || []).map((item, itemIndex) => (
                      <div key={itemIndex} className="history-item-row">
                        <span>
                          {item.emoji} {item.quantity}x {item.item_name}
                        </span>
                        <span>Rs {item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="history-total-row">
                      <span>Total ({order.payment_mode ? order.payment_mode.toUpperCase() : "UPI"})</span>
                      <span>Rs {order.total}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <Chatbot />

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
