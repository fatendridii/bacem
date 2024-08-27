const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const User = require('../../../Models/user');
const Token = require('../../../Models/token');

exports.createUser = async (req, res) => {
  try {
      const {
        firstname,
        lastname,
        email,
        password,
        role,
        Mobile,
        pays,
        showNotifications
      } = req.body;
      console.log(req.body);
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ message: "L'utilisateur existe déjà !" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      
       const ch = "0123456789abcdefghijklmnopqrstuvyzwABGJKLMPOUYTTEZAQBVC";
       var code = "";
       for (let index = 0; index < 10; index++) {
         code += ch[Math.floor(Math.random() * ch.length)];
       }

      const newUser = new User({
        firstname: firstname.charAt(0).toUpperCase()+firstname.slice(1),
        lastname: lastname.charAt(0).toUpperCase()+lastname.slice(1),
        email,
        password: hashedPassword,
        role,
        Mobile,
        pays,
        verifCode: code,
        showNotifications,
      });
      await newUser.save();
      const token = jwt.sign({
        userId: newUser._id
      }, process.env.JWT_SECRET);
      const tokenEntry = new Token({
        userId: newUser._id,
        token
      });
      await tokenEntry.save();
      
      res.status(201).json({ message: `Félécitations ${newUser.firstname} vous ètes membre dans notre plate forme Arzaak,entrez votre mot de passe pour se connecter` });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
