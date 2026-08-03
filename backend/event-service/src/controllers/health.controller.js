const healthCheck = (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "Event Service"
    });
};

module.exports = {
    healthCheck
};
