/**
 * Validates if a string is a properly formatted email.
 * @param {string} email 
 * @returns {boolean}
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validates password strength (min 6 characters).
 * @param {string} password 
 * @returns {boolean}
 */
const isValidPassword = (password) => {
    return typeof password === "string" && password.length >= 6;
};

module.exports = {
    isValidEmail,
    isValidPassword
};
