const bcrypt = require("bcrypt");
const authService = require("../services/auth.service");
const { isValidEmail, isValidPassword } = require("../utils/validation");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/token");

const signup = async (req, res) => {

    try {

        const { name, email, password, role } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        // Check if user already exists
        const existingUser = await authService.findUserByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user
        const user = await authService.createUser(
            name,
            email,
            hashedPassword,
            role || "user"
        );

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};

module.exports = {
    signup
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await authService.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save refresh token to DB (expires in 7 days)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await authService.saveRefreshToken(user.id, refreshToken, expiresAt);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        // Verify refresh token signature
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(403).json({
                success: false,
                message: "Invalid or expired refresh token"
            });
        }

        // Find in DB
        const savedToken = await authService.findRefreshToken(refreshToken);
        if (!savedToken) {
            return res.status(403).json({
                success: false,
                message: "Refresh token not registered"
            });
        }

        // Check DB expiration
        if (new Date(savedToken.expires_at) < new Date()) {
            await authService.deleteRefreshToken(refreshToken);
            return res.status(403).json({
                success: false,
                message: "Refresh token expired"
            });
        }

        // Find user
        const user = await authService.findUserById(decoded.id);
        if (!user) {
            return res.status(403).json({
                success: false,
                message: "User not found"
            });
        }

        // Generate new tokens (rotation)
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        // Delete old token and save new token
        await authService.deleteRefreshToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await authService.saveRefreshToken(user.id, newRefreshToken, expiresAt);

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        console.error("Token refresh error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        await authService.deleteRefreshToken(refreshToken);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await authService.findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    signup,
    login,
    refresh,
    logout,
    getProfile
};