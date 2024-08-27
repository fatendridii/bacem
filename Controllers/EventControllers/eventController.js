const Event = require('../../Models/event');
const User = require('../../Models/user');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require('multer');
const moment = require('moment');
const multerS3 = require('multer-s3');
const path = require('path');
require('dotenv').config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    key: function (req, file, cb) {
      const filename = Date.now().toString() + path.extname(file.originalname);
      console.log(`Uploading file: ${filename}`);
      cb(null, filename);
    },
  }),
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Erreur : Seules les images sont autorisées!"));
    }
  },
}).single("image");
exports.upload = upload; 
exports.createEvent = async (req, res) => {
  const { startDate, endDate, etat, price } = req.body;
  const currentDate = new Date();

  const start = new Date(startDate);
  const end = new Date(endDate);

 
  if (start < currentDate || end < currentDate) {
    return res.status(400).json({ message: "Les dates doivent être après la date actuelle." });
  }
  if (end < start) {
    return res.status(400).json({ message: "La date de fin doit être après la date de début." });
  }
  if (etat === 'payé' && (!price || price <= 0)) {
    return res.status(400).json({ message: "Le prix est requis pour un événement payé et doit être supérieur à 0." });
  }
  if (etat === 'gratuit' && price) {
    return res.status(400).json({ message: "Le prix ne doit pas être fourni pour un événement gratuit." });
  }
  const duration = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const event = new Event({
    startDate: start,
    endDate: end,
    titre: req.body.titre,
    description: req.body.description,
    price: etat === 'payé' ? req.body.price : undefined,
    etat: etat,
    duration: duration,
    numberMax: req.body.numberMax,
    local: req.body.local,
    status: req.body.status || 'standby',
  });
  try {
    const newEvent = await event.save();
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};



exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    const updatedEvents = events.map(event => ({
      ...event._doc,
      image: `${event.image}` 
    }));
    res.json(updatedEvents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const prevEvent = await Event.findOne({ _id: { $lt: req.params.id } }).sort({ _id: -1 }).limit(1);
    const prevId = prevEvent ? prevEvent._id : null;

    const nextEvent = await Event.findOne({ _id: { $gt: req.params.id } }).sort({ _id: 1 }).limit(1);
    const nextId = nextEvent ? nextEvent._id : null;
    const updatedEvent = {
      ...event._doc,
      image: `${event.image}`,
    };
    res.json({ event: updatedEvent, prevId, nextId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    let updatedData = { ...req.body };

    if (req.file) {
      const image = `${process.env.S3_BUCKET_URL}/${req.file.key}`;
      updatedData.image = image;
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.participateEvent = async (req, res) => {
  const { userId, eventId } = req.body;
  try {
    const event = await Event.findById(eventId);
    const user = await User.findById(userId);

    if (!event || !user) {
      return res.status(404).json({ message: "L'événement ou l'utilisateur n'a pas été trouvé." });
    }
    if (event.users.includes(userId)) {
      return res.status(400).json({ message: "vous avez participé déjà à cet événement." });
    }

    event.users.push(userId);
    user.events.push(eventId);
    await event.save();
    await user.save();

    res.status(200).json({ message: "Utilisateur participé à l'événement avec succès." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getParticipantsCount = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "L'événement n'a pas été trouvé." });
    }
    const participantsCount = event.users.length;
    res.status(200).json({ participantsCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllParticipants = async (req, res) => {
  try {
    const events = await Event.find().populate('users');

    const { titre } = req.query;
    let filteredParticipants = [];

    if (titre) {
      filteredParticipants = events
        .filter(event => event.titre === titre)
        .map(event => ({
          eventId: event._id,
          titre: event.titre,
          price: event.price,
          etat: event.etat,
          startDate: event.startDate,
          endDate: event.endDate,
          duration: event.duration,
          numberMax: event.numberMax,
          local: event.local,
          status: event.status,
          image: event.image,
          participants: event.users,
        }));
    } else {
      filteredParticipants = events.map(event => ({
        eventId: event._id,
        titre: event.titre,
        price: event.price,
        etat: event.etat,
        startDate: event.startDate,
        endDate: event.endDate,
        duration: event.duration,
        numberMax: event.numberMax,
        local: event.local,
        status: event.status,
        image: event.image,
        participants: event.users,
      }));
    }

    res.status(200).json(filteredParticipants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getParticipantsByEvent = async (req, res) => {
  try {
    const events = await Event.aggregate([
      {
        $project: {
          titre: 1,
          participantCount: { $size: "$users" }
        }
      }
    ]);
    res.json(events);
  } catch (error) {
    console.error("Error fetching participants by event:", error);
    res.status(500).json({ error: "An error occurred while fetching participants by event" });
  }
};
