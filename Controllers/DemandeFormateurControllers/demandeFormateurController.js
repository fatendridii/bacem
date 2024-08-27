const DemandeFormateur = require("../../Models/demandeFormateur");
const sendEmail = require("../../EmailSend/mailer");
const User = require("../../Models/user"); 
const bcrypt = require("bcrypt");
const { uploadSingleImage } = require("../../Utilis/uploadImageUtil");
require('dotenv').config();

exports.createDemande = async (req, res) => {
  uploadSingleImage(req, res, async (err) => {
    if (err) {
      res.status(400).json({ message: err });
    } else {
  const { firstname, lastname, email, telephone, formation, experience } = req.body;
  const image = req.file ? `${process.env.S3_BUCKET_URL}/${req.file.key}` : "";
  try {
    const newDemande = new DemandeFormateur({
      firstname: firstname,
      lastname: lastname,
        email: email,
        telephone: telephone,
        formation: formation,
        experience: experience,
        image: image,
    });

    const savedDemande = await newDemande.save();
    res.status(201).json(savedDemande);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
})
};

exports.getDemandes = async (req, res) => {
  try {
    const demandes = await DemandeFormateur.find();
    const updatedDemandes = demandes.map(demande => ({
      ...demande._doc,
      image: `${demande.image}`,
    }));
    res.json(updatedDemandes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getDemandeById = async (req, res) => {
  try {
    const demandeId = req.params.id;
    const demande = await DemandeFormateur.findById(demandeId).exec();

    if (!demande) {
      return res.status(404).json({ message: "demande non trouvée" });
    }

    const updatedDemande = {
      ...demande._doc,
      image: `${demande.image}`,
    };

    res.json(updatedDemande);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateDemande = async (req, res) => {
  try {
   
    const demande = await DemandeFormateur.findById(req.params.id);

    if (!demande) {
      return res.status(404).json({ message: "Demande not found" });
    }

    const updatedDemande = await DemandeFormateur.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (demande.status === "EnCours" && req.body.status === "Traitée") {
    
      const generatedPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      const newUser = new User({
        firstname: demande.firstname, 
        lastname: demande.lastname,
        email: demande.email,
        Mobile: demande.telephone,
        role: 'formateur',
        password: hashedPassword
      });

      await newUser.save();
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
        .button {
          background-color: #34314b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;
          display: inline-block; margin-top: 20px;
        }
      </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue chez ARZAAK</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${demande.firstname} ${demande.lastname}</strong>,</p>
            <p>Nous sommes heureux de vous informer que votre compte formateur a été créé avec succès !</p>
            <p>Voici vos informations de connexion :</p>
            <ul>
             
              <li><strong>Email :</strong> ${demande.email}</li>
              <li><strong>Mot de passe :</strong> ${generatedPassword}</li>
            </ul>
            <p>Pour commencer à utiliser votre compte, veuillez vous accéder a notre plateforme.</p>
            <a href="http://3.217.153.223/login" class="button">Commencer</a>
            <p>N'hésitez pas à nous contacter si vous avez des questions ou besoin d'assistance.</p>
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
        to: demande.email,
        subject: "Votre compte formateur a été créé",
        html: emailContent
        };

     
      await sendEmail(mailOptions);
    }

    res.json(updatedDemande);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.deleteDemande = async (req, res) => {
  try {
    const demande = await DemandeFormateur.findByIdAndDelete(req.params.id);
    if (!demande) {
      return res.status(404).json({ message: "demande not found" });
    }

    res.json({ message: "demande deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
