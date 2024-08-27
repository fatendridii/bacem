const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const User = require('../../../Models/user');

exports.login = async (req, res) => {
  try {
      const { email, password } = req.body;
      if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
      }
      const user = await User.findOne({
          $or: [
              { email: email },
              { username: email },
          ],
      });
      if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
          return res.status(401).json({ message: "Invalid email or password" });
      }
      if (user.status !== "active") {
          return res.status(401).json({ message: "Your account is not active. Please contact support." });
      }
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.json({ token });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
  }
};
