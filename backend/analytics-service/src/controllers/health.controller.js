const healthCheck = (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "Analytics Service"
    });
};

module.exports = {
    healthCheck
};
