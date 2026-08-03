const BASE_URL = "http://localhost:8000/api";

let _accessToken = null;
let _authListeners = [];

/**
 * Register listener to monitor authentication state changes.
 */
export const subscribeToAuthChanges = (listener) => {
    _authListeners.push(listener);
    return () => {
        _authListeners = _authListeners.filter(l => l !== listener);
    };
};

const notifyAuthListeners = (user) => {
    _authListeners.forEach(listener => listener(user));
};

/**
 * Retrieve user profile details from decoded access token or direct query.
 */
export const getCurrentUser = () => {
    if (!_accessToken) return null;
    try {
        const payload = JSON.parse(atob(_accessToken.split(".")[1]));
        return {
            id: payload.id,
            role: payload.role
        };
    } catch (e) {
        return null;
    }
};

/**
 * Initialize session by checking for stored refresh token and fetching a new access token.
 */
export const initializeSession = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    try {
        const response = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken })
        });

        if (response.status === 200) {
            const data = await response.json();
            _accessToken = data.accessToken;
            localStorage.setItem("refreshToken", data.refreshToken);
            
            // Get user profile info
            const profileRes = await api("/auth/profile");
            if (profileRes.success) {
                notifyAuthListeners(profileRes.user);
                return profileRes.user;
            }
        }
    } catch (error) {
        console.error("Session initialization failed:", error);
    }
    
    // Clear credentials if refresh fails
    logoutSession();
    return null;
};

/**
 * Complete user login session.
 */
export const loginSession = (user, accessToken, refreshToken) => {
    _accessToken = accessToken;
    localStorage.setItem("refreshToken", refreshToken);
    notifyAuthListeners(user);
};

/**
 * Clear session and log out user.
 */
export const logoutSession = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
        try {
            await fetch(`${BASE_URL}/auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken })
            });
        } catch (e) {
            console.error("Logout request error:", e);
        }
    }
    _accessToken = null;
    localStorage.removeItem("refreshToken");
    notifyAuthListeners(null);
};

/**
 * Unified API HTTP fetch wrapper. Handles path prefixing, request headers, 
 * and automatic token refreshing on 401 expiration.
 */
export const api = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    
    // Set headers
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (_accessToken) {
        headers["Authorization"] = `Bearer ${_accessToken}`;
    }

    const fetchOptions = {
        ...options,
        headers
    };

    try {
        let response = await fetch(url, fetchOptions);

        // Access token expired (401)
        if (response.status === 401) {
            console.log("Access token expired or missing. Attempting refresh...");
            const refreshToken = localStorage.getItem("refreshToken");
            
            if (refreshToken) {
                // Call refresh endpoint directly using fetch to prevent recursion
                const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refreshToken })
                });

                if (refreshResponse.status === 200) {
                    const refreshData = await refreshResponse.json();
                    _accessToken = refreshData.accessToken;
                    localStorage.setItem("refreshToken", refreshData.refreshToken);

                    // Retry original request with new access token
                    headers["Authorization"] = `Bearer ${_accessToken}`;
                    response = await fetch(url, fetchOptions);
                } else {
                    // Refresh token invalid or expired, log out
                    logoutSession();
                    throw new Error("Session expired. Please log in again.");
                }
            } else {
                throw new Error("Authentication required.");
            }
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error(`API Call [${options.method || "GET"} ${endpoint}] failed:`, error.message);
        return {
            success: false,
            message: error.message || "Network request failed"
        };
    }
};
