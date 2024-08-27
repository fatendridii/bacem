require('dotenv').config();
const User = require('../../../Models/user');

exports.getAssistant = async (req, res) => {
    try {       
        const assistants = await User.find({ role: 'assistant' });
        res.json({ assistants });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
