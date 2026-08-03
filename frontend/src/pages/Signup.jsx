import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user"); // defaults to attendee
    const [loading, setLoading] = useState(false);

    const { signup } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !email || !password) {
            addToast("Please fill in all fields", "error");
            return;
        }

        if (password.length < 6) {
            addToast("Password must be at least 6 characters", "error");
            return;
        }

        setLoading(true);
        const res = await signup(name, email, password, role);
        setLoading(false);

        if (res.success) {
            addToast("Account registered successfully! Please login.", "success");
            navigate("/login");
        } else {
            addToast(res.message || "Registration failed", "error");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <div className="auth-header">
                    <h2 className="auth-title">Create Account</h2>
                    <p className="auth-subtitle">Register to discover or manage events</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input 
                            type="email" 
                            className="form-input" 
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Account Role</label>
                        <select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)}
                            className="filter-select"
                            style={{ backgroundPosition: "right 16px center" }}
                        >
                            <option value="user">Attendee (Book seats at events)</option>
                            <option value="organizer">Organizer (Host, manage, and track events)</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: "28px" }}>
                        <label className="form-label">Password</label>
                        <input 
                            type="password" 
                            className="form-input" 
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ width: "100%", padding: "12px" }}
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Register"}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login" className="auth-link">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
