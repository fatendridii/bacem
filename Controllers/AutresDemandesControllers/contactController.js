const Contact = require("../../Models/demandes/contact");


exports.createContact = async (req, res) => {
  const { name, email, telephone, sujet, message } = req.body;
  try {
  
    const newContact = new Contact({
      name: name,
      email: email,
      telephone: telephone,
      sujet: sujet,
      message: message,
    });

    const savedContact = await newContact.save();

  
    res.status(201).json(savedContact);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(contact);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};