const Module = require("../../Models/module");
const Lecon = require("../../Models/lecon");

exports.createLecon = async (req, res) => {
  const { title, description, duration, videoUrl, moduleId } = req.body;

  try {
    const module = await Module.findById(moduleId);

    if (!module) {
      return res
        .status(404)
        .json({ message: "Le module spécifié n'existe pas." });
    }

    const newLecon = new Lecon({
      title: title,
      description: description || "",
      duration: duration,
      videoUrl: videoUrl,
      modules: [module._id],
    });

    const savedLecon = await newLecon.save();

    module.lecons.push(savedLecon._id);
    await module.save();

    res.status(201).json(savedLecon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.getLecons = async (req, res) => {
  try {
    const lecons = await Lecon.find().populate("modules");
    res.json(lecons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getLeconById = async (req, res) => {
  try {
    const leconId = req.params.id;
    const lecon = await Lecon.findById(leconId).populate("modules").exec();

    if (!lecon) {
      return res.status(404).json({ message: "lecon not found" });
    }
    res.json(lecon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateLecon = async (req, res) => {
  try {
    const updatedLecon = {
      title: req.body.title,
      description: req.body.description,
      duration: req.body.duration,
      videoUrl: req.body.videoUrl,
      modules: req.body.moduleId,
    }
    if (req.body. description !== undefined) {
      updatedLecon.description = req.body.description;
    }
    const lecon = await Lecon.findByIdAndUpdate(req.params.id, updatedLecon, {
      new: true,
    });

    if (!lecon) {
      return res.status(404).json({ message: "lecon not found" });
    }

    res.json(module);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.deleteLecon = async (req, res) => {
  try {
    const lecon = await Lecon.findByIdAndDelete(req.params.id);
    if (!lecon) {
      return res.status(404).json({ message: "lecon not found" });
    }

    const moduleId = lecon._id;
    await Module.updateMany({}, { $pull: { lecons: moduleId } });

    res.json({ message: "lecon deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
