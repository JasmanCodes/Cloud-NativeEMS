import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";

const EventDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [bookingCount, setBookingCount] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchEventData = async () => {
        setLoading(true);
        try {
            // Get event details (public)
            const eventRes = await api(`/events/${id}`);
            if (eventRes.success) {
                setEvent(eventRes.event);
            } else {
                addToast("Failed to load event details", "error");
                navigate("/");
                return;
            }

            // If user is authenticated, check their registration status
            if (user) {
                const bookingsRes = await api("/registrations/my-bookings");
                if (bookingsRes.success) {
                    const booking = bookingsRes.bookings.find(b => b.event_id === parseInt(id, 10));
                    setIsRegistered(!!booking);
                }
            }

            // Note: Since this is local dev and registration microservice enforces capacity, 
            // we will query the count from database manually, or we can just fetch it when booking.
            // Wait, we can fetch active booking counts in registrations if there is a route.
            // But we can check event details. In a real-world scenario we check in the booking action itself.
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventData();
    }, [id, user]);

    const handleBookingAction = async () => {
        if (!user) {
            navigate("/login");
            return;
        }

        setActionLoading(true);
        if (isRegistered) {
            // Cancel booking
            const res = await api("/registrations/cancel", {
                method: "POST",
                body: JSON.stringify({ eventId: parseInt(id, 10) })
            });
            if (res.success) {
                addToast("Booking cancelled successfully", "success");
                setIsRegistered(false);
            } else {
                addToast(res.message || "Failed to cancel booking", "error");
            }
        } else {
            // Book seat
            const res = await api("/registrations/book", {
                method: "POST",
                body: JSON.stringify({ eventId: parseInt(id, 10) })
            });
            if (res.success) {
                addToast("Successfully registered for this event!", "success");
                setIsRegistered(true);
            } else {
                addToast(res.message || "Failed to register", "error");
            }
        }
        setActionLoading(false);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    if (!event) {
        return (
            <div className="empty-state card">
                <h3>Event not found</h3>
                <Link to="/" className="btn btn-primary" style={{ marginTop: "16px" }}>Back to Explore</Link>
            </div>
        );
    }

    return (
        <div className="event-detail-page">
            <div className="event-header-container">
                <span className="event-category-badge event-detail-category">{event.category}</span>
                <h1 className="event-detail-title">{event.title}</h1>
            </div>

            <div className="event-detail-grid">
                <div className="event-main-info">
                    <div className="event-description-card card">
                        <h3 className="description-title">About this Event</h3>
                        <p className="description-text">{event.description || "No description provided."}</p>
                    </div>
                </div>

                <div className="event-sidebar-container">
                    <div className="event-sidebar-card card">
                        <div className="sidebar-section">
                            <span className="sidebar-label">Date & Time</span>
                            <span className="sidebar-value">{formatDate(event.date)}</span>
                            <span className="sidebar-value" style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "normal" }}>
                                Starts at {event.time}
                            </span>
                        </div>

                        <div className="sidebar-section">
                            <span className="sidebar-label">Location</span>
                            <span className="sidebar-value">{event.location}</span>
                        </div>

                        <div className="sidebar-section">
                            <span className="sidebar-label">Capacity</span>
                            <span className="sidebar-value">{event.capacity} Total Seats Available</span>
                        </div>

                        {user ? (
                            <button 
                                onClick={handleBookingAction} 
                                className={`btn ${isRegistered ? "btn-danger" : "btn-primary"}`}
                                disabled={actionLoading}
                                style={{ width: "100%", padding: "14px", fontSize: "15px" }}
                            >
                                {actionLoading ? "Processing..." : isRegistered ? "Cancel Registration" : "Book My Seat"}
                            </button>
                        ) : (
                            <Link 
                                to="/login" 
                                className="btn btn-primary"
                                style={{ width: "100%", padding: "14px", fontSize: "15px", textDecoration: "none" }}
                            >
                                Log in to Book
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
