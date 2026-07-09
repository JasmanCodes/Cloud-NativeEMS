const healthCheck = (req, res) => {

    res.status(200).json({
        status: "OK",
        service: "Authentication Service"
    });

};

module.exports = {
    healthCheck
};