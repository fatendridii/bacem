const Reclamation = require("../../Models/reclamation");
const User = require("../../Models/user");

exports.createReclamation = async (req, res) => {
  const { description, type, userId } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Le user spécifié n'existe pas." });
    }

    const newReclamation = new Reclamation({
      description: description,
      type: type,
      user: [user._id],
    });

    const savedReclamation = await newReclamation.save();

    user.reclamations.push(savedReclamation._id);
    await user.save();

    res.status(201).json(savedReclamation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.getReclamation = async (req, res) => {
    try {
      const reclamations = await Reclamation.find().populate("user");
      res.json(reclamations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  exports.getReclamationById = async (req, res) => {
    try {
      const reclamationId = req.params.id;
      const reclamation = await Reclamation.findById(reclamationId).populate("user").exec();
  
      if (!reclamation) {
        return res.status(404).json({ message: "reclamation not found" });
      }
      res.json(reclamation);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  exports.updateReclamation = async (req, res) => {
    try {
      const reclamation = await Reclamation.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      );
      res.json(reclamation);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };
  exports.deleteReclamation = async (req, res) => {
    try {
      const reclamation = await Reclamation.findByIdAndDelete(req.params.id);
      if (!reclamation) {
        return res.status(404).json({ message: "reclamation not found" });
      }
  
      const userId = reclamation._id;
      await User.updateMany({}, { $pull: { reclamations: userId } });
  
      res.json({ message: "reclamation deleted" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  exports.getReclamationByUser = async (req, res) => {
    const { userId } = req.params;
  
    try {
      const reclamations = await Reclamation.find({ user: userId });
      res.json(reclamations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  exports.countByType = async (req, res) => {
    try {
      const reclamationCounts = await Reclamation.aggregate([
        { 
          $group: { 
            _id: "$type", 
            count: { $sum: 1 } 
          } 
        },
        { 
          $project: { 
            _id: 0, 
            type: "$_id", 
            count: 1 
          } 
        }
      ]);
  
      res.json(reclamationCounts);
    } catch (error) {
      console.error("Erreur lors du comptage des réclamations par type :", error);
      res.status(500).json({ error: "Une erreur est survenue lors du comptage des réclamations par type" });
    }
  };
  