const signup = async (req, res) => {

    const { name, email, password } = req.body;

    console.log("Name :", name);
    console.log("Email :", email);
    console.log("Password :", password);

    res.status(200).json({
        success: true,
        message: "Data received successfully"
    });

};

module.exports = {
    signup
};