const Realisation = require("../../Models/realisation");
const User = require("../../Models/user");
require('dotenv').config();
const { uploadMultipleImages } = require("../../Utilis/uploadImageUtil");


exports.createRealisation = async (req, res) => {
  uploadMultipleImages(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: "Erreur lors du téléchargement des images." });
    }

    const { message, userId } = req.body;
    const images = req.files ? req.files.map(file => `${process.env.S3_BUCKET_URL}/${file.filename}`) : [];

    try {

      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ message: "L'utilisateur spécifié n'existe pas." });
      }
      const realisation = new Realisation({
        message,
        users: [user._id],
        images,
      });

      const newRealisation = await realisation.save();

      user.realisations.push(newRealisation._id);
      await user.save();
  

      res.status(201).json(newRealisation);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
};

exports.getRealisations = async (req, res) => {
  try {
    const realisations = await Realisation.find().populate("users");

    const realisationsWithS3Urls = realisations.map(realisation => ({
      ...realisation._doc,
      image: realisation.image ? `${realisation.image}` : null,
    }));

    res.json(realisationsWithS3Urls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRealisationById = async (req, res) => {
  try {
    const realisation = await Realisation.findById(req.params.id);

    if (!realisation) {
      return res.status(404).json({ message: "La réalisation n'a pas été trouvée." });
    }
    const realisationWithS3Url = {
      ...realisation._doc,
      image: realisation.image ? `${realisation.image}` : null,
    };
    res.json(realisationWithS3Url);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

