import React, { createContext, useContext, useState, useEffect } from "react";
import * as apiService from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sync state with api.js internal access token listener
    useEffect(() => {
        const unsubscribe = apiService.subscribeToAuthChanges((updatedUser) => {
            setUser(updatedUser);
        });

        // Initialize session on startup
        const checkSession = async () => {
            await apiService.initializeSession();
            setLoading(false);
        };

        checkSession();

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        const res = await apiService.api("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        if (res.success) {
            apiService.loginSession(res.user, res.accessToken, res.refreshToken);
        }
        return res;
    };

    const signup = async (name, email, password) => {
        const res = await apiService.api("/auth/signup", {
            method: "POST",
            body: JSON.stringify({ name, email, password })
        });
        return res;
    };

    const logout = async () => {
        await apiService.logoutSession();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
