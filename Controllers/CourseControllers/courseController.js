const Course = require("../../Models/course");
const mongoose = require("mongoose");
const Category = require("../../Models/category");
const Trainer = require("../../Models/trainer");
const User = require("../../Models/user");
const { notifyClients } = require('../../SSE/sse');
const Notification = require('../../Models/notification');
const axios = require('axios');
const { uploadSingleImage } = require("../../Utilis/uploadImageUtil");
require('dotenv').config();

const apiURL = process.env.PYTHON_APP_URL;

exports.createCourse = async (req, res) => {
  uploadSingleImage(req, res, async (err) => {
    if (err) {
      res.status(400).json({ message: err });
    } else {
      const {
        title,
        sousTitre,
        description,
        apprendreCours,
        price,
        level,
        language,
        infoSessionUrl,
        categoryId,
        trainerId,
      } = req.body;
      const image = req.file ? `${process.env.S3_BUCKET_URL}/${req.file.key}` : "";
      try {
        const category = await Category.findById(categoryId);
      

        if (!category) {
          return res
            .status(404)
            .json({ message: "La catégorie spécifiée n'existe pas." });
        }
        let trainer = null;
        if (trainerId && trainerId.trim() !== "") {
          trainer = await Trainer.findById(trainerId);
          if (!trainer) {
            return res
              .status(404)
              .json({ message: "Le formateur spécifié n'existe pas." });
          }
        }

        const newCourse = new Course({
          title: title,
          sousTitre: sousTitre || "",
          description: description,
          apprendreCours: apprendreCours,
          price: price || "",
          level: level,
          language: language,
          infoSessionUrl: infoSessionUrl,
          image: image,
          categorys: [category._id],
          trainers: trainer ? [trainer._id] : [],
        });

        const savedCourse = await newCourse.save();
        category.courses.push(savedCourse._id);
        await category.save();
       
        if (trainer) {
          trainer.courses.push(savedCourse._id);
          await trainer.save();
        }
        
        const notification = new Notification({
          message: `Nouveau cours ajouté sur notre plateforme: ${savedCourse.title}`,
          courseId: savedCourse._id,
          timestamp: Date.now()
        });
        await notification.save();

        notifyClients(savedCourse);
        res.status(201).json(savedCourse);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    }
  });
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("categorys")
      .populate("trainers")
      .populate("modules")
      .populate({
        path: "modules",
        populate: {
          path: "lecons",
          model: "Lecon",
        },
      })
      .populate("commentaires")
      .exec();

    const coursesWithS3Urls = courses.map(course => ({
      ...course._doc,
      image: course.image ? `${course.image}` : null,
      
    }));

    res.json(coursesWithS3Urls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId)
      .populate("categorys")
      .populate("trainers")
      .populate("modules")
      .populate("quiz")
      .populate({
        path: "modules",
        populate: {
          path: "lecons",
          model: "Lecon",
        },
      })
      .populate("commentaires")
      .exec();

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    const courseWithS3Url = {
      ...course._doc,
      image: course.image ? `${course.image}` : null,
    };

    let recommendations = [];
    try {
      const recommendationsResponse = await axios.get(`${apiURL}/api/recommendations/${courseId}`);
      recommendations = recommendationsResponse.data.recommendations;
    } catch (error) {
      console.error('Error fetching recommendations:', error.message);
    }

    courseWithS3Url.recommendations = recommendations;

    res.json(courseWithS3Url);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateCourse = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      res.status(400).json({ message: err });
    } else {
      try {
        const courseId = req.params.id;
        const existingCourse = await Course.findById(courseId);

        if (!existingCourse) {
          return res.status(404).json({ message: "Course not found" });
        }

        const updatedCourse = {
          title: req.body.title,
          description: req.body.description,
          apprendreCours: req.body.apprendreCours,
          level: req.body.level,
          language: req.body.language,
          infoSessionUrl: req.body.infoSessionUrl,
          categorys: req.body.categoryId,
        };

        if (req.body.sousTitre !== undefined) {
          updatedCourse.sousTitre = req.body.sousTitre;
        } else {
          updatedCourse.sousTitre = null;
        }

        if (req.body.price !== undefined) {
          updatedCourse.price = req.body.price;
        }

        if (req.body.trainerId !== undefined && req.body.trainerId.trim() !== '') {
          updatedCourse.trainers = req.body.trainerId;
        } else {
          updatedCourse.trainers = null;
        }

        if (req.file) {
          updatedCourse.image = `${process.env.S3_BUCKET_URL}/${req.file.key}`;
        }

        console.log("updatedCourse avant la mise à jour :", updatedCourse);

        const course = await Course.findByIdAndUpdate(
          courseId,
          updatedCourse,
          { new: true }
        );

        res.json(course);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    }
  });
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPriceCourse = async (req, res) => {
  try {
    const prices = await Course.distinct('price');
    res.json(prices);
  } catch (error) {
    console.error('Error fetching course prices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getCoursePaymentStatus = async (req, res) => {
  const { userId, courseId } = req.params;

  try {
    const user = await User.findById(userId).select('courses');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const course = user.courses.find(course => course.course.toString() === courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found for this user' });
    }

    res.json({ isPaid: course.isPaid });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getCoursePaymentCourseName = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select('courses');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const paidCourses = user.courses.filter(course => course.isPaid);
    const courseDetails = await Course.find({
      _id: { $in: paidCourses.map(course => course.course) }
    }).select('title image');

    res.json({ courseDetails });
  } catch (error) {
  
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.countStatistique = async (req, res) => {
  try {
    const courses = await Course.find()
   
      .populate({
        path: "categorys",
        populate: {
          path: "sessions",
          model: "SessionPrivee",
        },
      })
      .populate("trainers")
      .populate({
        path: "modules",
        populate: {
          path: "lecons",
          model: "Lecon",
        },
      })
      .populate("commentaires")
      .exec();

    const courseStats = courses.map(course => {
      let verifiedPaymentsSum = 0;
      let sessionCount = 0;
      
      let commentaireCount = course.commentaires.length;

    
      if (course.categorys) {
        course.categorys.forEach(category => {
          if (category.sessions) {
            sessionCount += category.sessions.length;
          }
        });
      }
      let paiementsCount = course.paiements.length;
     
  

      return {
        course,
        paiementsCount,
        sessionCount,
        commentaireCount
      };
    });

   
    const sortedByPayments = [...courseStats].sort((a, b) => b.paiementsCount - a.paiementsCount);
    const sortedBySessions = [...courseStats].sort((a, b) => b.sessionCount - a.sessionCount);
    const sortedByCommentaires = [...courseStats].sort((a, b) => b.commentaireCount - a.commentaireCount);

    res.json({
      sortedByPayments: sortedByPayments.map(cs => ({
        courseId: cs.course.title,
        paiementsCount: cs.paiementsCount
      })),
      sortedBySessions: sortedBySessions.map(cs => ({
        courseId: cs.course.title,
        sessionCount: cs.sessionCount
      })),
      sortedByCommentaires: sortedByCommentaires.map(cs => ({
        courseId: cs.course.title,
        commentaireCount: cs.commentaireCount
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
