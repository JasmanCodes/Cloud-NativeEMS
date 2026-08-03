import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

const Admin = () => {
    const [summary, setSummary] = useState(null);
    const [popular, setPopular] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [summaryRes, popularRes, categoriesRes] = await Promise.all([
                api("/analytics/summary"),
                api("/analytics/popular?limit=5"),
                api("/analytics/categories")
            ]);

            if (summaryRes.success) {
                setSummary(summaryRes.summary);
            } else {
                addToast("Failed to fetch platform summary statistics", "error");
            }

            if (popularRes.success) {
                setPopular(popularRes.events);
            }

            if (categoriesRes.success) {
                setCategories(categoriesRes.categories);
            }
        } catch (error) {
            console.error("Fetch analytics dashboard error:", error);
            addToast("An error occurred loading reports", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const getMaxEventCount = () => {
        if (categories.length === 0) return 1;
        return Math.max(...categories.map(c => c.eventCount));
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    const maxCount = getMaxEventCount();

    return (
        <div style={{ textAlign: "left" }}>
            <h1 className="dashboard-title" style={{ margin: "32px 0 16px" }}>Platform Admin Analytics</h1>
            <p className="dashboard-subtitle">Global platform usage, registration statistics, and event distributions.</p>

            {summary && (
                <div className="metrics-row">
                    <div className="metric-card">
                        <span className="metric-label">Registered Accounts</span>
                        <span className="metric-value">{summary.totalUsers}</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-label">Total Events Published</span>
                        <span className="metric-value">{summary.totalEvents}</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-label">Active Registrations</span>
                        <span className="metric-value" style={{ color: "var(--success)" }}>
                            {summary.totalBookings}
                        </span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-label">Cancelled Tickets</span>
                        <span className="metric-value" style={{ color: "var(--danger)" }}>
                            {summary.totalCancelled}
                        </span>
                    </div>
                    <div className="metric-card" style={{ borderColor: "rgba(6, 182, 212, 0.4)" }}>
                        <span className="metric-label" style={{ color: "var(--secondary)" }}>Platform Revenue</span>
                        <span className="metric-value" style={{ color: "var(--secondary)" }}>
                            ${summary.platformRevenue.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            <div className="charts-grid">
                {/* Category Distribution Chart */}
                <div className="chart-card card">
                    <h3 className="table-title">Events by Category</h3>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        Visual share of published events across genres.
                    </p>

                    <div className="chart-bars-container">
                        {categories.length > 0 ? (
                            categories.map((c, i) => {
                                const percentage = maxCount > 0 ? (c.eventCount / maxCount) * 100 : 0;
                                return (
                                    <div key={i} className="chart-bar-row">
                                        <div className="chart-bar-labels">
                                            <span style={{ fontWeight: "600" }}>{c.category}</span>
                                            <span style={{ color: "var(--text-secondary)" }}>
                                                {c.eventCount} {c.eventCount === 1 ? "event" : "events"}
                                            </span>
                                        </div>
                                        <div className="chart-bar-bg">
                                            <div 
                                                className="chart-bar-fill"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No categories data available.</p>
                        )}
                    </div>
                </div>

                {/* Popular Events Stats */}
                <div className="chart-card card" style={{ padding: "32px", display: "flex", flexDirection: "column" }}>
                    <h3 className="table-title">Top 5 Trending Events</h3>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        Ranked by total attendee registrations.
                    </p>

                    <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                        {popular.length > 0 ? (
                            popular.map((item, index) => (
                                <div 
                                    key={item.id}
                                    style={{ 
                                        display: "flex", 
                                        alignItems: "center", 
                                        gap: "16px",
                                        paddingBottom: "14px",
                                        borderBottom: index < popular.length - 1 ? "1px solid var(--border)" : "none"
                                    }}
                                >
                                    <div 
                                        style={{ 
                                            width: "36px", 
                                            height: "36px", 
                                            borderRadius: "50%", 
                                            background: "rgba(255, 255, 255, 0.03)", 
                                            border: "1px solid var(--border)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: "800",
                                            fontSize: "14px",
                                            color: "var(--text-secondary)"
                                        }}
                                    >
                                        #{index + 1}
                                    </div>
                                    
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: "600", fontSize: "14.5px" }}>{item.title}</div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                                            Category: {item.category} • Location: {item.location}
                                        </div>
                                    </div>

                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontWeight: "700", color: "var(--primary)", fontSize: "16px" }}>
                                            {item.active_bookings}
                                        </div>
                                        <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                                            Booked
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No event bookings registered yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
