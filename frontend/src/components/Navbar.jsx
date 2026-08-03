import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Navbar = () => {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        addToast("Logged out successfully");
        navigate("/");
    };

    return (
        <nav className="navbar">
            <Link to="/" className="nav-brand">
                EventSphere
            </Link>

            <div className="nav-links">
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>
                    Explore
                </NavLink>

                {user && (
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        My Bookings
                    </NavLink>
                )}

                {user && (user.role === "organizer" || user.role === "admin") && (
                    <NavLink to="/organizer" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        Organizer Console
                    </NavLink>
                )}

                {user && user.role === "admin" && (
                    <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        Admin Analytics
                    </NavLink>
                )}
            </div>

            <div className="nav-actions">
                {user ? (
                    <>
                        <div className="user-badge">
                            <div className="avatar">
                                {user.name ? user.name.substring(0, 2) : "US"}
                            </div>
                            <span className="user-name">{user.name}</span>
                        </div>
                        <button onClick={handleLogout} className="btn btn-secondary">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="btn btn-secondary">
                            Login
                        </Link>
                        <Link to="/signup" className="btn btn-primary">
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
