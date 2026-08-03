import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            addToast("Please fill in all fields", "error");
            return;
        }

        setLoading(true);
        const res = await login(email, password);
        setLoading(false);

        if (res.success) {
            addToast("Logged in successfully", "success");
            
            // Redirect based on role or simple explore page
            if (res.user.role === "admin") {
                navigate("/admin");
            } else if (res.user.role === "organizer") {
                navigate("/organizer");
            } else {
                navigate("/");
            }
        } else {
            addToast(res.message || "Invalid credentials", "error");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <div className="auth-header">
                    <h2 className="auth-title">Welcome Back</h2>
                    <p className="auth-subtitle">Login to manage your bookings and events</p>
                </div>

                <form onSubmit={handleSubmit}>
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

                    <div className="form-group" style={{ marginBottom: "28px" }}>
                        <label className="form-label">Password</label>
                        <input 
                            type="password" 
                            className="form-input" 
                            placeholder="••••••••"
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
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/signup" className="auth-link">Register</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
