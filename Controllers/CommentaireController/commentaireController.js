const Commentaire = require("../../Models/commentaire");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const Course = require("../../Models/course");
const Etoile = require("../../Models/etoile");
const { calculateAverageRating } = require("../../Middleware/rating");
const axios = require('axios');
const mongoose = require('mongoose');

app.use(bodyParser.json());

const apiURL = process.env.PYTHON_APP_URL;

async function detectLanguage(text) {
  try {
    const response = await axios.post(`${apiURL}/detect-language`, { text });
    return response.data.language;
  } catch (error) {
    console.error('Erreur lors de la détection de la langue :', error);
    return null;
  }
}

async function analyzeSentiment(text) {
  try {
    const response = await axios.post(`${apiURL}/analyze-sentiment`, { text });
    return { sentiment_score: response.data.sentiment_score, sentiment_label: response.data.sentiment_label };
  } catch (error) {
    console.error('Erreur lors de l\'analyse du sentiment :', error);
    return null;
  }
}

exports.createCommentaire = async (req, res) => {
  try {
    const { course, user, content, rating } = req.body;
    if (!rating || rating === 0) {
      return res.status(400).json({ error: "Veuillez sélectionner une note pour le commentaire." });
    }

    const { sentiment_score, sentiment_label } = await analyzeSentiment(content);
    const language = await detectLanguage(content);

    const commentaire = new Commentaire({
      course,
      user,
      content,
      sentimentScore: sentiment_score,
      sentimentLabel: sentiment_label,
      language,
    });

    const savedCommentaire = await commentaire.save();

    const etoile = new Etoile({
      user,
      commentaire: savedCommentaire._id,
      couses: savedCommentaire.course,
      rating,
    });

    await etoile.save();

    savedCommentaire.etoiles.push(etoile._id);
    await savedCommentaire.save();

    const courseToUpdate = await Course.findById(course);
    courseToUpdate.commentaires.push(savedCommentaire._id);
    await courseToUpdate.save();

    res.status(201).json({
      message: "Commentaire avec évaluation créé avec succès",
      commentaire: savedCommentaire,
      etoile,
    });

  } catch (error) {
    console.error("Erreur lors de la création du commentaire avec évaluation :", error);
    res.status(500).json({ error: "Erreur lors de la création du commentaire avec évaluation" });
  }
};
exports.getCommentairesByCourseId = async (req, res) => {
  try {
    const courseId = req.params.id;
    const commentaires = await Commentaire.find({ course: courseId })
      .populate("course")
      .populate("user")
      .populate("etoiles")
      .exec();

    res.status(200).json(commentaires);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message:
          "Une erreur est survenue lors de la récupération des commentaires.",
      });
  }
};
exports.getAllCommentaires = async (req, res) => {
  try {
    const commentaires = await Commentaire.find()
      .populate("course")
      .populate("user")
      .populate("etoiles");

    res.status(200).json(commentaires);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message:
          "Une erreur est survenue lors de la récupération des commentaires.",
      });
  }
};
exports.updateCommentaireById = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, rating } = req.body;

    const updatedCommentaire = await Commentaire.findByIdAndUpdate(
      id,
      { content },
      { new: true }
    );

    if (!updatedCommentaire) {
      return res.status(404).json({ error: "Commentaire non trouvé" });
    }

    let etoile = await Etoile.findOne({ commentaire: id });

    if (!etoile) {
      etoile = new Etoile({ commentaire: id });
    }

    etoile.rating = rating;
    await etoile.save();

    res
      .status(200)
      .json({
        message: "Commentaire mis à jour avec succès",
        commentaire: updatedCommentaire,
        etoile,
      });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du commentaire avec évaluation :",
      error
    );
    res
      .status(500)
      .json({
        error: "Erreur lors de la mise à jour du commentaire avec évaluation",
      });
  }
};

exports.deleteCommentaireById = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCommentaire = await Commentaire.findByIdAndDelete(id);

    if (!deletedCommentaire) {
      return res.status(404).json({ error: "Commentaire non trouvé" });
    }

    await Etoile.findOneAndDelete({ commentaire: id });

    res
      .status(200)
      .json({
        message: "Commentaire supprimé avec succès",
        commentaire: deletedCommentaire,
      });
  } catch (error) {
    console.error(
      "Erreur lors de la suppression du commentaire avec évaluation :",
      error
    );
    res
      .status(500)
      .json({
        error: "Erreur lors de la suppression du commentaire avec évaluation",
      });
  }
};

exports.getAverageRating = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const averageRating = await calculateAverageRating(courseId);

    res.status(200).json({ averageRating });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la moyenne de rating du cours :",
      error
    );
    res
      .status(500)
      .json({
        error:
          "Erreur lors de la récupération de la moyenne de rating du cours",
      });
  }
};
exports.getCourseRatings = async (req, res) => {
  const courseId = req.params.courseId;

  try {
    const ratings = await Etoile.aggregate([
      { $match: { couses: new mongoose.Types.ObjectId(courseId) } }, 
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      }
    ]);

    const ratingCounts = {};
    ratings.forEach(({ _id, count }) => {
      ratingCounts[_id] = count;
    });

    return res.json(ratingCounts);
  } catch (error) {
    console.error("Error fetching course ratings:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};