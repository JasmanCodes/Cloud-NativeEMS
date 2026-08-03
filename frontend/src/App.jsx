import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";

// Pages
import Explore from "./pages/Explore";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Organizer from "./pages/Organizer";
import Admin from "./pages/Admin";

// Route guard for authenticated users
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="spinner"></div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Route guard for role-restricted access
const RoleRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="spinner"></div>;
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

function AppContent() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Navbar />
            <main style={{ flex: 1 }}>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Explore />} />
                    <Route path="/events/:id" element={<EventDetails />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Attendee protected routes */}
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Organizer/Admin protected routes */}
                    <Route 
                        path="/organizer" 
                        element={
                            <RoleRoute allowedRoles={["organizer", "admin"]}>
                                <Organizer />
                            </RoleRoute>
                        } 
                    />

                    {/* Admin analytics only */}
                    <Route 
                        path="/admin" 
                        element={
                            <RoleRoute allowedRoles={["admin"]}>
                                <Admin />
                            </RoleRoute>
                        } 
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <footer className="app-footer">
                <p>&copy; {new Date().getFullYear()} EventSphere Inc. Built with Microservices & Kubernetes.</p>
            </footer>
        </div>
    );
}

function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <BrowserRouter>
                    <AppContent />
                </BrowserRouter>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
