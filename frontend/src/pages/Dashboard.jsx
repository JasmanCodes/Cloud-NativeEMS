import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

const Dashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, notificationsRes] = await Promise.all([
                api("/registrations/my-bookings"),
                api("/registrations/notifications")
            ]);

            if (bookingsRes.success) {
                setBookings(bookingsRes.bookings);
            } else {
                addToast("Failed to load your bookings", "error");
            }

            if (notificationsRes.success) {
                setNotifications(notificationsRes.notifications);
            }
        } catch (e) {
            console.error("Dashboard fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleCancelBooking = async (eventId) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) {
            return;
        }

        const res = await api("/registrations/cancel", {
            method: "POST",
            body: JSON.stringify({ eventId })
        });

        if (res.success) {
            addToast("Registration cancelled successfully", "success");
            // Refresh list
            fetchDashboardData();
        } else {
            addToast(res.message || "Failed to cancel booking", "error");
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    return (
        <div>
            <h1 className="dashboard-title">My Bookings</h1>
            <p className="dashboard-subtitle">Manage your registered events, schedules, and tickets.</p>

            <div className="metrics-row">
                <div className="metric-card">
                    <span className="metric-label">Active Bookings</span>
                    <span className="metric-value">{bookings.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="spinner"></div>
            ) : bookings.length > 0 ? (
                <div className="table-card card">
                    <div className="table-title-bar">
                        <h3 className="table-title">Registered Events</h3>
                    </div>

                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Event Details</th>
                                <th>Schedule</th>
                                <th>Location</th>
                                <th>Category</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => (
                                <tr key={booking.registration_id}>
                                    <td 
                                        style={{ fontWeight: "600", cursor: "pointer", color: "var(--text-primary)" }}
                                        onClick={() => navigate(`/events/${booking.event_id}`)}
                                    >
                                        {booking.title}
                                    </td>
                                    <td>
                                        <div>{formatDate(booking.date)}</div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                                            Starts at {booking.time}
                                        </div>
                                    </td>
                                    <td>{booking.location}</td>
                                    <td>
                                        <span className="event-category-badge" style={{ margin: 0 }}>
                                            {booking.category}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                            <Link to={`/events/${booking.event_id}`} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", textDecoration: "none" }}>
                                                View
                                            </Link>
                                            <button 
                                                onClick={() => handleCancelBooking(booking.event_id)} 
                                                className="btn btn-danger"
                                                style={{ padding: "6px 12px", fontSize: "12px" }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state card">
                    <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "48px", height: "48px", margin: "0 auto 16px" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="empty-state-title">No bookings yet</h3>
                    <p style={{ marginBottom: "20px" }}>Explore our events catalog and register for workshops, hackathons, or music summits.</p>
                    <Link to="/" className="btn btn-primary" style={{ textDecoration: "none" }}>Explore Events</Link>
                </div>
            )}

            {/* Notification logs panel */}
            <div className="table-card card" style={{ marginTop: "32px", textAlign: "left" }}>
                <h3 className="table-title">Notification & Email Dispatch Logs</h3>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", marginBottom: "20px" }}>
                    Real-time status of transactional email dispatches triggered by your bookings.
                </p>

                {!loading && notifications.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {notifications.map((notif) => (
                            <div 
                                key={notif.id}
                                style={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "space-between",
                                    padding: "12px 16px",
                                    backgroundColor: "rgba(255, 255, 255, 0.01)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "var(--radius-sm)"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span 
                                        className="event-category-badge"
                                        style={{ 
                                            margin: 0,
                                            backgroundColor: notif.event_type === "registration.created" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                                            borderColor: notif.event_type === "registration.created" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                            color: notif.event_type === "registration.created" ? "var(--success)" : "var(--danger)"
                                        }}
                                    >
                                        {notif.event_type === "registration.created" ? "Confirmed" : "Cancelled"}
                                    </span>
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: "600" }}>
                                            Email Alert sent for: "{notif.event_title}"
                                        </div>
                                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                                            Triggered: {new Date(notif.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <span 
                                    className="event-category-badge"
                                    style={{ 
                                        margin: 0,
                                        backgroundColor: notif.status === "processed" ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
                                        borderColor: notif.status === "processed" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                                        color: notif.status === "processed" ? "var(--success)" : "var(--warning)"
                                    }}
                                >
                                    {notif.status}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", padding: "10px 0" }}>
                        No notification dispatches logged yet. Try booking or cancelling a seat.
                    </p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
