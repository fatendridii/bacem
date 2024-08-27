const Trainer = require('../../Models/trainer');
const User = require('../../Models/user');
const { uploadSingleImage } = require("../../Utilis/uploadImageUtil");
require('dotenv').config();
  
  exports.createTrainer = async (req, res) => {
    uploadSingleImage(req, res, async (err) => {
      if (err) {
        res.status(400).json({ message: err });
      } else {
        const { firstname, lastname, adresse, email, formation, experience, prixHeure } = req.body;
        const image = req.file ? `${process.env.S3_BUCKET_URL}/${req.file.key}` : "";
        const userId = req.body.user;
        try {
        
          let user = null;
          if (userId) {
            user = await User.findById(userId);
            if (!user || user.role !== 'formateur') {
              return res.status(403).json({ message: 'User is not a formateur' });
            }
          }

        const trainer = new Trainer({
          firstname: firstname,
          lastname: lastname,
          adresse: adresse,
          email: email,
          formation: formation,
          experience: experience,
          prixHeure: prixHeure,
          image: image,
          user: userId || null
        });
  
     
          const newTrainer = await trainer.save();
          res.status(201).json(newTrainer);
        } catch (err) {
          res.status(400).json({ message: err.message });
        }
      }
    });
  };
  exports.getTrainers = async (req, res) => {
    try {
      const trainers = await Trainer.find();
  
      const trainersWithS3Urls = trainers.map(trainer => ({
        ...trainer._doc,
        image: trainer.image ? `${trainer.image}` : null,
      }));
  
      res.json(trainersWithS3Urls);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  exports.getTrainerById = async (req, res) => {
    try {
      const trainer = await Trainer.findById(req.params.id);
  
      if (!trainer) {
        return res.status(404).json({ message: 'Trainer not found' });
      }
      const trainerWithS3Url = {
        ...trainer._doc,
        image: trainer.image ? `${process.env.S3_BUCKET_URL}/${trainer.image}` : null,
      };
  
      res.json(trainerWithS3Url);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
exports.updateTrainer = async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        res.status(400).json({ message: err });
      } else {
        try {
          const updatedTrainer = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            adresse: req.body.adresse,
            email: req.body.email,
            formation: req.body.formation,
            experience: req.body.experience,
            prixHeure: req.body.prixHeure
    
          };
  
          if (req.file) {
            updatedTrainer.image =  `${process.env.S3_BUCKET_URL}/${req.file.key}`;
          }
          const userId = req.body.user;

      if (userId) {
        const user = await User.findById(userId);
        if (!user || user.role !== 'formateur') {
          return res.status(403).json({ message: 'User is not a formateur' });
        }
        updatedTrainer.user = userId;
      }
  
          const trainer = await Trainer.findByIdAndUpdate(req.params.id, updatedTrainer, { new: true });
  
          if (!trainer) {
            return res.status(404).json({ message: 'Trainer not found' });
          }
  
          res.json(trainer);
        } catch (err) {
          res.status(400).json({ message: err.message });
        }
      }
    });
  };
  
exports.deleteTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findByIdAndDelete(req.params.id);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }
    res.json({ message: 'Trainer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.countCourseForFormateur = async (req, res) => {
  try {
    const userId = req.params.userId; 
    const user = await User.findById(userId);
  
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'formateur') {
      return res.status(403).json({ message: 'User is not a formateur' });
    }
    const trainer = await Trainer.findOne({ user: userId }).populate({
      path: 'courses',
      populate: { path: 'paiements' }
    });

    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    const courses = trainer.courses;
    let totalPayments = 0;
    let verifiedPaymentsSum = 0;
    let sessionCount = trainer.sessions.length;

    courses.forEach(course => {
      course.paiements.forEach(payment => {
      
        if (payment.state === "Vérifier") {
          verifiedPaymentsSum += payment.price;
        }
      });
      totalPayments += course.paiements.length;
    });
    res.json({
      courseCount: courses.length,
      paymentCount: totalPayments,
      sessionCount: sessionCount,
      verifiedPaymentsSum: verifiedPaymentsSum
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.returnSessionForFormateur = async (req, res) => {
  try {
    const userId = req.params.userId; 
    const user = await User.findById(userId);
  
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  
      const trainer = await Trainer.findOne({ user: userId }) .populate({
        path: 'sessions',
        populate: {
          path: 'planificationSession',
          model: 'PlanificationSession' 
        }
      });
  
      if (!trainer) {
        return res.status(404).json({ message: 'Trainer not found' });
      }
    
      res.json(trainer)
   
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};