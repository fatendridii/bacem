const MiseEnContact = require("../../Models/demandes/miseEnContact");


exports.createMiseEnContact = async (req, res) => {
  const { title, description } = req.body;
  try {
  
    const newMiseEnContact = new MiseEnContact({
      title: title,
      description: description
     
    });

    const savedMiseEnContact = await newMiseEnContact.save();

  
    res.status(201).json(savedMiseEnContact);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.getMiseEnContacts = async (req, res) => {
  try {
    const miseEnContacts = await MiseEnContact.find();
    res.json(miseEnContacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateMiseEnContact = async (req, res) => {
  try {
    const miseEnContact = await MiseEnContact.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(miseEnContact);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
