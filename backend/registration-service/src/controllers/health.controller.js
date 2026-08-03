const healthCheck = (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "Registration Service"
    });
};

module.exports = {
    healthCheck
};
