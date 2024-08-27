const MiseEnRelation = require("../../Models/demandes/miseEnRelation");


exports.createMiseEnRelation = async (req, res) => {
  const { title, description } = req.body;
  try {
  
    const newMiseEnRelation = new MiseEnRelation({
      title: title,
      description: description
    });

    const savedMiseEnRelation = await newMiseEnRelation.save();

  
    res.status(201).json(savedMiseEnRelation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.getMiseEnRelations = async (req, res) => {
  try {
    const miseEnRelations = await MiseEnRelation.find();
    res.json(miseEnRelations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateMiseEnRelation = async (req, res) => {
  try {
    const miseEnRelation = await MiseEnRelation.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(miseEnRelation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};