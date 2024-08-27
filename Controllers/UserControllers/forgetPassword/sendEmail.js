const sendEmail = require("../../../EmailSend/mailer");
const User = require("../../../Models/user");
exports.emailSendForgetPassword = async (req, res) => {
  try {
    const findEmail = await User.findOne({ email: req.body.email });
    if (findEmail) {
      const ch = "123456789abcdefghijklmnpqrstuvyzwABGJKLMPUYTTEZAQBVC";
      var code = "";
      for (let index = 0; index < 5; index++) {
        code += ch[Math.floor(Math.random() * ch.length)];
      }
      const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
      <title>Bienvenue chez ARZAAK</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { width: 80%; margin: 20px auto; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
        .header { background-color: #f9a11b; color: white; padding: 10px 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f9a11b; color: white; text-align: center; padding: 10px 20px; }
       
      </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue chez ARZAAK</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${findEmail.firstname}</strong>,</p>
            <p>Voilà le code de confirmation de votre adresse email pour ajouter un nouveau mot de passe à votre compte dans notre site "ARZAAK" :</p>
             <h2> ${code}</h2>
            </div>
          <div class="footer">
            Cordialement,<br>
            L'équipe d'Arzaak
          </div>
        </div>
      </body>
      </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: req.body.email,
        subject: "Arzaak-Mot de passe oublié",
        html: emailContent
      };
      const updateUser = findEmail.set({ ...findEmail, verifCode: code });
      await updateUser.save();
      await sendEmail(mailOptions);
      res.status(200).send({msg:"Nous avons envoyé une code de vérification à votre boite email en raison de sécurité " });
    } else {
      res
        .status(400)
        .send({
          msg: "Adresse email introuvable.Il faut donc créer un compte ! ",
        });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Erreur serveur.");
  }
};


