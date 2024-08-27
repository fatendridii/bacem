const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../../../Models/user");
require("dotenv").config();

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "L'e-mail et le mot de passe sont requis" });
    }
    const user = await User.findOne({email:email});

    if (!user) {
      return res.status(400).json({ message: "Email ou mot de passe invalide" });
    } else {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Email ou mot de passe invalide" });
      }
      const Token = jwt.sign({ email: user.email ,id:user._id,role:user.role}, "1234");
      const updateUser=user.set({...user,googleConnect:false});
      await updateUser.save();
      res.status(200).send({
        message: `Bienvenue ${user.firstname} dans notre plateforme Arzaak`,
        token: Token,
        user: {
          role:user.role,
          nom: user.firstname,
          prenom: user.lastname,
          email: user.email,
          Mobile: user.Mobile,
          image: user.image,
          _id: user._id,
          googleConnect:user.googleConnect
        },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};