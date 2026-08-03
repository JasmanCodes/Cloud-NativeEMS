import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Organizer = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form fields state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("Tech");
    const [capacity, setCapacity] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    const fetchMyEvents = async () => {
        setLoading(true);
        const res = await api("/events");
        if (res.success) {
            // Filter events created by the logged in organizer (or all if admin)
            const myEvents = res.events.filter(
                (e) => e.organizer_id === user.id || user.role === "admin"
            );
            setEvents(myEvents);
        } else {
            addToast("Failed to load events", "error");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMyEvents();
    }, [user]);

    const handleCreateEvent = async (e) => {
        e.preventDefault();

        if (!title || !date || !time || !location || !category || !capacity) {
            addToast("Please fill in all required fields", "error");
            return;
        }

        const parsedCapacity = parseInt(capacity, 10);
        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
            addToast("Capacity must be a positive number", "error");
            return;
        }

        setFormLoading(true);
        const res = await api("/events", {
            method: "POST",
            body: JSON.stringify({
                title,
                description,
                date,
                time,
                location,
                category,
                capacity: parsedCapacity
            })
        });
        setFormLoading(false);

        if (res.success) {
            addToast("Event created successfully!", "success");
            // Clear form
            setTitle("");
            setDescription("");
            setDate("");
            setTime("");
            setLocation("");
            setCategory("Tech");
            setCapacity("");
            setShowForm(false);
            // Reload list
            fetchMyEvents();
        } else {
            addToast(res.message || "Failed to create event", "error");
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event? This will remove all attendee bookings as well.")) {
            return;
        }

        const res = await api(`/events/${id}`, {
            method: "DELETE"
        });

        if (res.success) {
            addToast("Event deleted successfully", "success");
            fetchMyEvents();
        } else {
            addToast(res.message || "Failed to delete event", "error");
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
            <div className="table-title-bar" style={{ margin: "32px 0 16px" }}>
                <h1 className="dashboard-title" style={{ margin: 0 }}>Organizer Console</h1>
                <button 
                    onClick={() => setShowForm(!showForm)} 
                    className="btn btn-primary"
                >
                    {showForm ? "View My Events" : "+ Create Event"}
                </button>
            </div>
            <p className="dashboard-subtitle">Build, customize, and orchestrate events you are hosting.</p>

            {/* Platform Fees & Monetization Summary */}
            {!showForm && (
                <div className="metrics-row">
                    <div className="metric-card">
                        <span className="metric-label">Hosted Events</span>
                        <span className="metric-value">{events.length}</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-label">Accrued Posting Fees</span>
                        <span className="metric-value" style={{ color: "var(--danger)" }}>
                            ${(events.length * 15).toFixed(2)}
                        </span>
                    </div>
                    <div className="metric-card" style={{ flex: 1.5 }}>
                        <span className="metric-label">Monetization & Commission Tier</span>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px", lineHeight: "1.4" }}>
                            • <strong>$15.00 flat fee</strong> charged per published event listing.<br />
                            • <strong>$2.50 seat commission</strong> automatically processed per active attendee registration.
                        </p>
                    </div>
                </div>
            )}

            {showForm ? (
                <div className="card" style={{ maxWidth: "650px", margin: "0 auto 64px", textAlign: "left" }}>
                    <h3 className="description-title">Host a New Event</h3>
                    
                    <form onSubmit={handleCreateEvent}>
                        <div className="form-group">
                            <label className="form-label">Event Title *</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="e.g. Node.js Architecture Hackathon"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea 
                                className="form-input" 
                                placeholder="Details about schedule, speakers, topics, and prizes..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="4"
                                style={{ resize: "vertical", fontFamily: "var(--font-sans)" }}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div className="form-group">
                                <label className="form-label">Date *</label>
                                <input 
                                    type="date" 
                                    className="form-input" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Start Time *</label>
                                <input 
                                    type="time" 
                                    className="form-input" 
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="Tech">Technology</option>
                                    <option value="Music">Music & Art</option>
                                    <option value="Networking">Networking</option>
                                    <option value="Health">Health & Wellness</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Total Seat Capacity *</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    placeholder="e.g. 100"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    required
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: "28px" }}>
                            <label className="form-label">Location / Platform *</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="e.g. San Francisco, CA or Zoom Link"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ display: "flex", gap: "16px" }}>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                style={{ flex: 1, padding: "12px" }}
                                disabled={formLoading}
                            >
                                {formLoading ? "Publishing Event..." : "Publish Event"}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setShowForm(false)} 
                                className="btn btn-secondary"
                                style={{ padding: "12px 24px" }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            ) : loading ? (
                <div className="spinner"></div>
            ) : events.length > 0 ? (
                <div className="table-card card">
                    <h3 className="table-title" style={{ marginBottom: "24px" }}>My Hosted Events</h3>

                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Date & Time</th>
                                <th>Location</th>
                                <th>Category</th>
                                <th>Capacity</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id}>
                                    <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                                        <Link to={`/events/${event.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                                            {event.title}
                                        </Link>
                                    </td>
                                    <td>
                                        <div>{formatDate(event.date)}</div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                                            Starts at {event.time}
                                        </div>
                                    </td>
                                    <td>{event.location}</td>
                                    <td>
                                        <span className="event-category-badge" style={{ margin: 0 }}>
                                            {event.category}
                                        </span>
                                    </td>
                                    <td>{event.capacity} seats</td>
                                    <td style={{ textAlign: "right" }}>
                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                            <Link to={`/events/${event.id}`} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", textDecoration: "none" }}>
                                                View Details
                                            </Link>
                                            <button 
                                                onClick={() => handleDeleteEvent(event.id)} 
                                                className="btn btn-danger"
                                                style={{ padding: "6px 12px", fontSize: "12px" }}
                                            >
                                                Delete
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="empty-state-title">No events published</h3>
                    <p style={{ marginBottom: "20px" }}>Publish your first workshop or meet-up to start accepting attendee registrations.</p>
                    <button onClick={() => setShowForm(true)} className="btn btn-primary">Create Event</button>
                </div>
            )}
        </div>
    );
};

export default Organizer;
