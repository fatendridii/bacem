const Module = require("../../Models/module");
const Course = require("../../Models/course");

exports.createModule = async (req, res) => {
  const { title, description, courseId } = req.body;
  
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ message: "Le cours spécifié n'existe pas." });
    }

    const newModule = new Module({
      title: title,
      description: description || "",
      courses: [course._id],
    });

    const savedModule = await newModule.save();

    course.modules.push(savedModule._id);
    await course.save();

    res.status(201).json(savedModule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getModules = async (req, res) => {
  try {
    const modules = await Module.find().populate("courses").populate("lecons");
    res.json(modules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getModuleById = async (req, res) => {
  try {
    const moduleId = req.params.id;
    const module = await Module.findById(moduleId)
      .populate("courses")
      .populate("lecons")
      .exec();

    if (!module) {
      return res.status(404).json({ message: "Module non trouvé" });
    }

    res.json(module);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateModule = async (req, res) => {
  try {
    const updatedModule = {
      title: req.body.title,
     
      courses: req.body.courseId,
    };
    
    if (req.body. description !== undefined) {
      updatedModule.description = req.body.description;
    }

    const module = await Module.findByIdAndUpdate(
      req.params.id,
      updatedModule,
      { new: true }
    );

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    res.json(module);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.deleteModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndDelete(req.params.id);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    const courseId = module._id;
    await Course.updateMany({}, { $pull: { modules: courseId } });

    res.json({ message: "Module deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
