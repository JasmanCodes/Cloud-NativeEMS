import React, { useState, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const Explore = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [location, setLocation] = useState("");

    const fetchEvents = async () => {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (category !== "All") queryParams.append("category", category);
        if (location) queryParams.append("location", location);

        const res = await api(`/events?${queryParams.toString()}`);
        if (res.success) {
            setEvents(res.events);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, [category, location, user]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchEvents();
    };

    const filteredEvents = events.filter(event => 
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(search.toLowerCase()))
    );

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    // Redirect Organizers and Admins away from the attendee Explore view
    if (user && user.role === "organizer") {
        return <Navigate to="/organizer" replace />;
    }
    if (user && user.role === "admin") {
        return <Navigate to="/admin" replace />;
    }

    // Public marketing landing page view (when not logged in)
    if (!user) {
        return (
            <div>
                <section className="marketing-hero">
                    <h1 className="marketing-title">
                        Discover and Host Amazing Events
                    </h1>
                    <p className="marketing-subtitle">
                        Find workshops, conferences, and local meetups near you, or easily create, host, and manage your own event listings.
                    </p>
                    <div className="marketing-cta-group">
                        <Link to="/signup" className="btn btn-primary" style={{ padding: "12px 28px", textDecoration: "none" }}>
                            Create Free Account
                        </Link>
                        <Link to="/login" className="btn btn-secondary" style={{ padding: "12px 28px", textDecoration: "none" }}>
                            Log In
                        </Link>
                    </div>
                </section>

                {/* Platform Features Showcase */}
                <section className="marketing-features">
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <svg style={{ width: "24px", height: "24px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3>Secure Accounts</h3>
                        <p>Your personal profiles, hosted event listings, and private tickets are guarded by industry-standard session security.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <svg style={{ width: "24px", height: "24px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5M9 14h6v6H9v-6z" />
                            </svg>
                        </div>
                        <h3>Instant Booking</h3>
                        <p>Lock in your seats immediately. Our ticket allocation process ensures bookings and email confirmations are handled instantly.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <svg style={{ width: "24px", height: "24px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3>Insightful Dashboards</h3>
                        <p>Track attendee counts, event category breakdowns, and overall hosting revenue in clean, professional charts.</p>
                    </div>
                </section>

                {/* Preview of Upcoming Events */}
                <div style={{ textAlign: "left", marginBottom: "32px" }}>
                    <h2 className="explore-title" style={{ fontSize: "24px", marginBottom: "8px" }}>Featured Upcoming Events</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "14.5px" }}>Register or log in to book a seat at these conferences.</p>
                </div>

                {loading ? (
                    <div className="spinner"></div>
                ) : filteredEvents.length > 0 ? (
                    <div className="event-grid">
                        {filteredEvents.slice(0, 3).map((event) => (
                            <div 
                                key={event.id} 
                                className="event-card"
                                onClick={() => navigate(`/events/${event.id}`)}
                            >
                                <div className="event-card-body">
                                    <span className="event-category-badge">{event.category}</span>
                                    <h3 className="event-card-title">{event.title}</h3>
                                    <p className="event-card-desc">
                                        {event.description && event.description.length > 120 
                                            ? `${event.description.substring(0, 120)}...` 
                                            : event.description}
                                    </p>
                                    <div className="event-metadata">
                                        <div className="metadata-item">
                                            <svg className="metadata-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>{formatDate(event.date)} at {event.time}</span>
                                        </div>
                                        <div className="metadata-item">
                                            <svg className="metadata-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>{event.location}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "40px" }}>
                        No events published yet.
                    </p>
                )}
            </div>
        );
    }

    // Authenticated Explore Page View
    return (
        <div>
            <header className="explore-header">
                <h1 className="explore-title">Explore Upcoming Events</h1>
                <p style={{ color: "var(--text-muted)", fontSize: "14.5px", marginTop: "4px" }}>
                    Search and register for hackathons, seminars, and workshops.
                </p>
            </header>

            <form onSubmit={handleSearchSubmit} className="search-filter-bar">
                <div className="search-input-wrapper">
                    <input 
                        type="text" 
                        placeholder="Search events by title or keywords..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>

                <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="filter-select"
                >
                    <option value="All">All Categories</option>
                    <option value="Tech">Technology</option>
                    <option value="Music">Music & Art</option>
                    <option value="Networking">Networking</option>
                    <option value="Health">Health & Wellness</option>
                    <option value="Other">Other</option>
                </select>

                <input 
                    type="text" 
                    placeholder="Location (e.g. Virtual, NY)..." 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="search-input"
                    style={{ maxWidth: "200px" }}
                />
            </form>

            {loading ? (
                <div className="spinner"></div>
            ) : filteredEvents.length > 0 ? (
                <div className="event-grid">
                    {filteredEvents.map((event) => (
                        <div 
                            key={event.id} 
                            className="event-card"
                            onClick={() => navigate(`/events/${event.id}`)}
                        >
                            <div className="event-card-body">
                                <span className="event-category-badge">{event.category}</span>
                                <h3 className="event-card-title">{event.title}</h3>
                                <p className="event-card-desc">
                                    {event.description && event.description.length > 120 
                                        ? `${event.description.substring(0, 120)}...` 
                                        : event.description}
                                </p>
                                <div className="event-metadata">
                                    <div className="metadata-item">
                                        <svg className="metadata-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{formatDate(event.date)} at {event.time}</span>
                                    </div>
                                    <div className="metadata-item">
                                        <svg className="metadata-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{event.location}</span>
                                    </div>
                                    <div className="metadata-item">
                                        <svg className="metadata-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20H2v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span>Capacity: {event.capacity} seats</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state card">
                    <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="empty-state-title">No events found</h3>
                    <p>We couldn't find any events matching your search criteria. Try modifying your filters or search keywords.</p>
                </div>
            )}
        </div>
    );
};

export default Explore;
