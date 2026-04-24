import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { FaArrowLeft, FaClipboardList, FaBoxes, FaCalendarAlt, FaPlay, FaCheck, FaCheckDouble, FaClock, FaExclamationTriangle, FaToggleOn, FaToggleOff, FaSyncAlt, FaMoon, FaSun, FaUsers } from "react-icons/fa";
import { menuItems } from "../data/mockData";
import { getOrders, updateOrderStatus as updateOrderAPI, getBookings, getTables, updateTableStatus as updateTableStatusAPI, updateItemAvailability, getInventory } from "../services/api";
import "./ManagerView.css";

export default function ManagerView() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [inventory, setInventory] = useState(menuItems.map((item) => ({ ...item })));
  const [activeTab, setActiveTab] = useState("orders");

  // Load data from backend API
  const loadData = useCallback(async () => {
    try {
      // Load Orders
      const apiOrders = await getOrders();
      if (apiOrders !== null) {
        setOrders(apiOrders.orders || []);
      }

      // Load Tables
      const apiTables = await getTables();
      if (apiTables && apiTables.tables) {
        setTables(apiTables.tables);
      }

      // Load Inventory
      const invResult = await getInventory();
      if (invResult && invResult.inventory) {
        setInventory(invResult.inventory);
      }

      // Load ALL bookings
      const apiBookings = await getBookings(true);
      if (apiBookings !== null) {
        setBookings(apiBookings.bookings || []);
      }
    } catch (e) {
      console.error("API Error:", e);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderAPI(orderId, newStatus);
      loadData();
    } catch (e) {
      console.error("Failed to update order status", e);
    }
  };

  const handleTableStatusChange = async (tableId, newStatus) => {
    try {
      await updateTableStatusAPI(tableId, newStatus);
      loadData();
    } catch (e) {
      console.error("Failed to update table status", e);
    }
  };

  const toggleAvailability = async (itemId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await updateItemAvailability(itemId, newStatus);
      setInventory((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isAvailable: newStatus } : item
        )
      );
    } catch (e) {
      console.error("Failed to toggle availability", e);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "placed": return "badge-orange";
      case "preparing": return "badge-yellow";
      case "ready": return "badge-green";
      case "completed": return "badge-purple";
      default: return "badge-purple";
    }
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case "available": return "badge-green";
      case "occupied": return "badge-red";
      case "reserved": return "badge-orange";
      case "maintenance": return "badge-gray";
      default: return "badge-gray";
    }
  };

  const getNextStatus = (status) => {
    switch (status) {
      case "placed": return "preparing";
      case "preparing": return "ready";
      case "ready": return "completed";
      default: return null;
    }
  };

  const getStatusAction = (status) => {
    switch (status) {
      case "placed": return { label: "Start Preparing", icon: <FaPlay /> };
      case "preparing": return { label: "Mark Ready", icon: <FaCheck /> };
      case "ready": return { label: "Complete", icon: <FaCheckDouble /> };
      default: return null;
    }
  };

  const activeOrders = orders.filter((o) => o.status !== "completed");
  const todayRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeBookingsCount = bookings.filter(b => b.status === "confirmed").length;

  return (
    <div className="page-container manager-page">
      {/* Header */}
      <header className="manager-header glass">
        <button className="btn-icon" onClick={() => navigate("/")}>
          <FaArrowLeft />
        </button>
        <div>
          <h2>👨‍🍳 Manager Dashboard</h2>
          <p className="header-sub">{new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
        </div>
        <div className="manager-header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
            {isDark ? <FaSun /> : <FaMoon />}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <FaSyncAlt /> Refresh
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card card">
          <span className="kpi-icon">📦</span>
          <div className="kpi-value" style={{ color: "var(--purple)" }}>{orders.length}</div>
          <div className="kpi-label">Total Orders</div>
        </div>
        <div className="kpi-card card">
          <span className="kpi-icon">🔥</span>
          <div className="kpi-value" style={{ color: "var(--orange)" }}>{activeOrders.length}</div>
          <div className="kpi-label">Active Queue</div>
        </div>
        <div className="kpi-card card">
          <span className="kpi-icon">💰</span>
          <div className="kpi-value" style={{ color: "var(--green)" }}>₹{todayRevenue}</div>
          <div className="kpi-label">Revenue</div>
        </div>
        <div className="kpi-card card">
          <span className="kpi-icon">🪑</span>
          <div className="kpi-value" style={{ color: "var(--cyan)" }}>{activeBookingsCount}</div>
          <div className="kpi-label">Active Bookings</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="manager-tabs">
        <button className={`chip ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
          <FaClipboardList /> Orders {activeOrders.length > 0 && <span className="tab-count">{activeOrders.length}</span>}
        </button>
        <button className={`chip ${activeTab === "bookings" ? "active" : ""}`} onClick={() => setActiveTab("bookings")}>
          <FaCalendarAlt /> Bookings
        </button>
        <button className={`chip ${activeTab === "tables" ? "active" : ""}`} onClick={() => setActiveTab("tables")}>
          <FaUsers /> Tables
        </button>
        <button className={`chip ${activeTab === "inventory" ? "active" : ""}`} onClick={() => setActiveTab("inventory")}>
          <FaBoxes /> Inventory
        </button>
      </div>

      {/* Tab Content */}
      <div className="manager-content">
        {/* Orders */}
        {activeTab === "orders" && (
          <>
            {orders.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📋</span>
                <h3>No Orders Yet</h3>
                <p>When students place orders, they will appear here in real-time.</p>
              </div>
            ) : (
              <div className="orders-grid">
                {orders.map((order, i) => (
                  <div key={order.id} className={`order-card card order-${order.status}`} style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="order-card-header">
                      <span className="order-id">{order.id}</span>
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="order-student">
                      👤 {order.student_name}
                      {order.payment_mode && (
                        <span className={`badge badge-sm badge-${order.payment_mode === 'cash' ? 'yellow' : 'cyan'}`} style={{ marginLeft: '8px' }}>
                          {order.payment_mode.toUpperCase()}
                        </span>
                      )}
                    </p>
                    <div className="order-items">
                      {order.items.map((item, j) => (
                        <div key={j} className="order-item-row">
                          <span>{item.emoji || ""} {item.item_name}</span>
                          <span>x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-card-footer">
                      <div className="order-meta">
                        <span><FaClock /> {order.placed_at}</span>
                        <span className="order-total">₹{order.total}</span>
                      </div>
                      {getNextStatus(order.status) && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => updateStatus(order.id, getNextStatus(order.status))}
                        >
                          {getStatusAction(order.status).icon} {getStatusAction(order.status).label}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Bookings */}
        {activeTab === "bookings" && (
          <>
            {bookings.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🪑</span>
                <h3>No Bookings Yet</h3>
                <p>When students book tables, their reservations will show up here.</p>
              </div>
            ) : (
              <div className="bookings-manager-grid">
                {bookings.map((b, i) => (
                  <div key={b.id} className={`booking-manager-card card status-${b.status}`} style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="booking-manager-header">
                      <span className="booking-table-badge">{b.tableLabel || `T${b.table_id}`}</span>
                      <span className={`badge ${b.status === 'confirmed' ? 'badge-green' : 'badge-red'}`}>
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </span>
                    </div>
                    <div className="booking-manager-details">
                      <div className="booking-detail-row">
                        <span>👤 Student</span>
                        <strong>{b.student_name || "Student"}</strong>
                      </div>
                      <div className="booking-detail-row">
                        <span>📅 Date</span>
                        <strong>{b.date}</strong>
                      </div>
                      <div className="booking-detail-row">
                        <span>🕐 Time</span>
                        <strong>{b.time_slot}</strong>
                      </div>
                      <div className="booking-detail-row">
                        <span>👥 Members</span>
                        <strong>{b.members}</strong>
                      </div>
                    </div>
                    {b.status === 'cancelled' && (
                      <div className="booking-cancel-info">
                        ⚠️ Cancelled! Make sure the table is <strong>Available</strong>.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tables */}
        {activeTab === "tables" && (
          <div className="tables-manager-grid">
             {tables.map((t) => (
               <div key={t.id} className={`table-manager-card card status-${t.status}`}>
                  <div className="table-manager-header">
                     <span className="table-badge">{t.label}</span>
                     <span className={`badge ${getTableStatusColor(t.status)}`}>{t.status}</span>
                  </div>
                  <div className="table-manager-info">
                    <p>Capacity: {t.capacity} seats</p>
                    <p>Zone: {t.zone}</p>
                  </div>
                  <div className="table-manager-actions">
                     <button 
                        className={`btn btn-sm ${t.status === 'available' ? 'btn-secondary disabled' : 'btn-primary'}`}
                        onClick={() => handleTableStatusChange(t.id, 'available')}
                        disabled={t.status === 'available'}
                     >
                        Mark Available
                     </button>
                     <button 
                        className={`btn btn-sm ${t.status === 'occupied' ? 'btn-secondary disabled' : 'btn-primary'}`}
                        onClick={() => handleTableStatusChange(t.id, 'occupied')}
                        disabled={t.status === 'occupied'}
                     >
                        Mark Occupied
                     </button>
                  </div>
               </div>
             ))}
          </div>
        )}

        {/* Inventory */}
        {activeTab === "inventory" && (
          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id} className={item.stock <= 5 ? "low-stock" : ""}>
                    <td>
                      <div className="inv-item-info">
                        {item.image ? (
                          <img src={item.image} alt="" className="inv-thumb" />
                        ) : (
                          <span className="inv-emoji">{item.emoji}</span>
                        )}
                        {item.name}
                        {item.stock <= 5 && <FaExclamationTriangle className="stock-warning" />}
                      </div>
                    </td>
                    <td><span className="badge badge-purple">{item.category}</span></td>
                    <td>₹{item.price}</td>
                    <td className={item.stock <= 5 ? "stock-low-text" : ""}>{item.stock}</td>
                    <td>
                      <button
                        className={`toggle-btn ${item.isAvailable ? "on" : "off"}`}
                        onClick={() => toggleAvailability(item.id, item.isAvailable)}
                      >
                        {item.isAvailable ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
