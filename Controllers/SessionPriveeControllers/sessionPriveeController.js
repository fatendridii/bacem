const SessionPrivee = require("../../Models/sessionPrivee");
const User = require("../../Models/user");
const Category = require("../../Models/category");
const Trainer = require("../../Models/trainer");

exports.createSession = async (req, res) => {
  const { email, telephone, besoin, trainerId, categoryId, userId } = req.body;
  
  try {
    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      return res
        .status(404)
        .json({ message: "Le trainer spécifié n'existe pas." });
    }
    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ message: "La categorie spécifié n'existe pas." });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "L utilisateur spécifié n'existe pas." });
    }

    const newSession = new SessionPrivee({
        email: email,
        telephone: telephone,
        besoin: besoin,
        trainer: [trainer._id],
        category: [category._id],
        user: [user._id],
    });

    const savedSession = await newSession.save();

    trainer.sessions.push(savedSession._id);
    await trainer.save();

    category.sessions.push(savedSession._id);
    await category.save();

    user.sessions.push(savedSession._id);
    await user.save();

    res.status(201).json(savedSession);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const sessions = await SessionPrivee.find().populate("trainer").populate("category")
    .populate("user").populate("planificationSession");
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await SessionPrivee.findById(sessionId)
    .populate("trainer").
    populate("category").
    populate("user")
      .exec();

    if (!session) {
      return res.status(404).json({ message: "session non trouvée" });
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateSession = async (req, res) => {
  try {
    const updateSession = {
    
        email: req.body.email,
        telephone: req.body.telephone,
        besoin: req.body.besoin,
        trainer: req.body.trainerId,
        category: req.body.categoryId,
        user: req.body.userId
    };
    const session = await SessionPrivee.findByIdAndUpdate(
      req.params.id,
      updateSession,
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: "session not found" });
    }

    res.json(session);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.deleteSession = async (req, res) => {
  try {
    const session = await SessionPrivee.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "session not found" });
    }

    const trainerId = session._id;
    await Trainer.updateMany({}, { $pull: { sessions: trainerId } });

    const categoryId = session._id;
    await Category.updateMany({}, { $pull: { sessions: categoryId } });

    const userId = session._id;
    await User.updateMany({}, { $pull: { sessions: userId } });

    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSessionsForUser = async (req, res) => {
  try {
    const userId = req.params.userId; 
    const user = await User.findById(userId);
  
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

   
    const sessions = await SessionPrivee.find({ user: userId }).populate("planificationSession");

    if (!sessions || sessions.length === 0) {
      return res.status(404).json({ message: 'No sessions found for this user' });
    }

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

