const pool = require("../config/db");

const findUserByEmail = async (email) => {
    const query = "SELECT * FROM users WHERE email = $1";

    const result = await pool.query(query, [email]);

    return result.rows[0];
};

const findUserById = async (id) => {
    const query = "SELECT id, name, email, role, created_at FROM users WHERE id = $1";

    const result = await pool.query(query, [id]);

    return result.rows[0];
};

const createUser = async (name, email, hashedPassword, role = "user") => {
    const query = `
        INSERT INTO users(name, email, password, role)
        VALUES($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at
    `;

    const result = await pool.query(query, [
        name,
        email,
        hashedPassword,
        role
    ]);

    return result.rows[0];
};

const saveRefreshToken = async (userId, token, expiresAt) => {
    const query = `
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (token) DO UPDATE SET expires_at = $3, user_id = $1
        RETURNING *
    `;

    const result = await pool.query(query, [userId, token, expiresAt]);

    return result.rows[0];
};

const findRefreshToken = async (token) => {
    const query = "SELECT * FROM refresh_tokens WHERE token = $1";

    const result = await pool.query(query, [token]);

    return result.rows[0];
};

const deleteRefreshToken = async (token) => {
    const query = "DELETE FROM refresh_tokens WHERE token = $1";

    await pool.query(query, [token]);
};

module.exports = {
    findUserByEmail,
    findUserById,
    createUser,
    saveRefreshToken,
    findRefreshToken,
    deleteRefreshToken
};