const Paiement = require("../../Models/paiement");
const Course = require("../../Models/course");
const User = require("../../Models/user");
const Lecon = require("../../Models/lecon");

exports.getPaiements = async (req, res) => {
  try {
    const paiements = await Paiement.find().populate("courses").populate("user");
    res.json(paiements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getPaiementById = async (req, res) => {
  try {
    const paiement = await Paiement.findById(req.params.id);
    if (!paiement) {
      return res.status(404).json({ message: "Paiement not found" });
    }
    res.json(paiement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.createPaiement = async (req, res) => {
  const { price, userId, courseIds, method } = req.body;

  try {
     
      if (!userId) {
          return res.status(400).json({ message: "L'ID utilisateur est manquant." });
      }

     
      if (!Array.isArray(courseIds) || courseIds.length === 0) {
          return res.status(400).json({ message: "Les IDs des cours sont manquants ou invalides." });
      }

      
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: "L'utilisateur spécifié n'existe pas." });
      }

    
      const courses = await Course.find({ _id: { $in: courseIds } });
      if (courses.length !== courseIds.length) {
          return res.status(404).json({ message: "Certains cours spécifiés n'existent pas." });
      }

     
      const existingPaiements = await Paiement.find({
          user: user._id,
          courses: { $in: courseIds }
      });

      if (existingPaiements.length > 0) {
          return res.status(400).json({
              message: "Vous avez déjà choisi un mode de paiement pour certains de ces cours. Veuillez attendre la vérification de l'administrateur."
          });
      }

      const newPaiement = new Paiement({
          method: method,
          price: price,
          user: user._id,
          courses: courseIds
      });

     
      const savedPaiement = await newPaiement.save();

   
      user.paiements.push(savedPaiement._id);

      for (let course of courses) {
        user.courses.push({ course: course._id, price: course.price, courseName: course.title });
      }
      await user.save();
    
      for (let course of courses) {
          course.paiements.push(savedPaiement._id);
          await course.save();
      }

      res.status(201).json(savedPaiement);
  } catch (err) {
      res.status(400).json({ message: err.message });
  }
};


exports.updatePaiement = async (req, res) => {
  try {
    const paiement = await Paiement.findByIdAndUpdate(
      req.params.id,
      { state: req.body.state },
      { new: true }
    );

    if (req.body.state === "Vérifier") {
    
      const courses = await Course.find({ _id: { $in: paiement.courses } });

      for (let course of courses) {
     
        for (let module of course.modules) {
          const lecons = await Lecon.find({ module: module._id });
          for (let lecon of lecons) {
            lecon.visibility = "public";
            await lecon.save();
          }
        }

       
        await User.updateOne(
          { _id: paiement.user, 'courses.course': course._id },
          { $set: { 'courses.$.isPaid': true } }
        );

        await course.save();
      }
         }

    res.json(paiement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};



exports.deletePaiement = async (req, res) => {
  try {
    const paiement = await Paiement.findByIdAndDelete(req.params.id);
    if (!paiement) {
      return res.status(404).json({ message: "Paiement not found" });
    }
    const paiementId = paiement._id;
    await Course.updateMany({}, { $pull: { paiement: paiementId } });

    res.json({ message: "Paiement deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};