const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../../EmailSend/mailer"); 
const User = require('../../../Models/user');
const Token = require('../../../Models/token');

exports.createUser = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      username,
      email,
      password,
      Mobile,
      portfolio
    } = req.body;
    const existingUser = await User.findOne({
      email
    });
    if (existingUser) {
      return res.status(400).json({
        message: "Assistant already exists"
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Créer le verifCode
    const ch = "0123456789abcdefghijklmnopqrstuvyzwABGJKLMPOUYTTEZAQBVC";
    var code = "";
    for (let index = 0; index < 10; index++) {
      code += ch[Math.floor(Math.random() * ch.length)];
    }
    const newUser = new User({
      firstname,
      lastname,
      username,
      email,
      password: hashedPassword,
      role: "assistant",
      Mobile,
      portfolio,
      verifCode: code
    });
    await newUser.save();
    await sendEmail({
      from: email,
      to: process.env.EMAIL_ADDRESS,
      subject: "Demande d'un Nouvel Assistant",
      html: `
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" valign="top" style="background-color: #838383;"><br><br>
          <table width="600" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center" valign="top" bgcolor="#d3be6c" style="background-color: beige; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #000000; padding: 0px 15px 10px 15px;">
                <div style="font-size: 38px; color:#ff8000;">
                <br>
                  <p>Arzaak</p>
                </div>
                <div style="font-size: 20px; color: black;">
                   Bonjour Admin,<br>
                   un nouvel assistant a envoyé une demande.<br>
                </div>
                <div style="color: black;">
                <br> <b>Détails de l'assistant :</b><br>
                <br> <span><b>Nom:</b></span> <span>${firstname} ${lastname}</span><br>
                <span><b>Username:</b></span> <span>${username}</span><br>
                <span><b>Email:</b></span> <span>${email}</span><br>
                <span><b>Mot de passe:</b></span> <span>${password}</span><br>
                <span><b>Description:</b></span> <span>${portfolio}</span><br><br>
                Cordialement,<br><br>
                Arzaak <br>
              </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
      `
    });
    const token = jwt.sign({
      userId: newUser._id
    }, process.env.JWT_SECRET);
    const tokenEntry = new Token({
      userId: newUser._id,
      token
    });
    await tokenEntry.save();
    res.status(201).json({
      message: "Assistant créé avec succès"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur interne du serveur"
    });
  }
};
