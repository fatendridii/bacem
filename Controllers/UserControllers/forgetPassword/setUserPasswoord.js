
const bcrypt = require("bcrypt");
const User = require("../../../Models/user");
exports.setUserPassword = async (req, res) => {
  const { newPassword, email, code } = req.body;

  try {
    const findUser = await User.findOne({ email: email });
    if (findUser) {
      if (findUser.verifCode === code) {
        const ch = "0123456789abcdefghijklmnopqrstuvyzwABGJKLMPOUYTTEZAQBVC";
        var Code = "";
        for (let index = 0; index < 15; index++) {
          Code += ch[Math.floor(Math.random() * ch.length)];
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        const verif = await bcrypt.compare(
          req.body.newPassword,
          findUser.password
        );
        if (verif) {
          res
            .status(402)
            .send({ msg: "veuillez saisir un autre nouveau mot de passe  !" });
        } else {
          findUser.set({
            ...findUser,
            password: hashedPassword,
            verifCode: Code,
          });
          const updatedUser = await findUser.save();
          res.status(200).send({
            msg: `Mot de passe a été réinitialisé avec succés ${findUser.firstname}.Entrez votre nouveau mot de passe pour se connecter`
          });
        }
      } else {
        res.status(401).send({
          msg: `erreur lors de l'authentification serveur (vérifiez le code de vérification envoyé dans votre adresse email)`,
        });
      }
    } else {
      res.status(400).send("utilisateur non trouvé ! ");
    }
  } catch (error) {
    res.status(500).send("Erreur serveur");
  }
};

exports.codeVerificationForgetPassword = async(req,res)=>{
   const { email, code } = req.body;
  try {
   const findUser = await User.findOne({ email: email });
   if (!findUser) {
    res.status(400).send({msg:'utilisateur non trouvé'})
   } else {
    //verification code:
    if (code===findUser.verifCode) {
      res.status(200).send({msg:'Authentification validé'})
    } else {
      res.status(401).send({msg:"Authentification non validé:code de vérification non valide"})
    }
   }
  } catch (error) {
    res.status(500).send("Erreur serveur")
  }
}
