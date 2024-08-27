const Category = require("../../Models/category");
const Course = require("../../Models/course");
const { uploadSingleImage } = require("../../Utilis/uploadImageUtil");
require('dotenv').config();


exports.createCategory = async (req, res) => {
  uploadSingleImage(req, res, async (err) => {
    if (err) {
      console.error('Error during file upload:', err);
      res.status(400).json({ message: err.message || "Unknown error" });
    } else {
      const { name, description, status } = req.body;
      const image = req.file ? `${process.env.S3_BUCKET_URL}/${req.file.key}` : "";

      const category = new Category({
        name: name,
        description: description,
        status: status,
        image: image,
      });

      try {
        const newCategory = await category.save();
        res.status(201).json(newCategory);
      } catch (err) {
        console.error('Error during category save:', err);
        res.status(400).json({ message: err.message });
      }
    }
  });
};

exports.getCategorys = async (req, res) => {
  try {
    const categorys = await Category.find();
    const updatedCategories = categorys.map(category => ({
      ...category._doc,
      image: `${category.image}`,
    }));
    res.json(updatedCategories);
  } catch (err) {
    console.error('Error during fetching categories:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    const updatedCategory = {
      ...category._doc,
      image: `${category.image}`,
    };
    res.json(updatedCategory);
  } catch (err) {
    console.error('Error during fetching category by ID:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Error during file upload:', err);
      res.status(400).json({ message: err.message || "Unknown error" });
    } else {
      try {
        const updatedCategory = {
          name: req.body.name,
          description: req.body.description,
          status: req.body.status,
        };

        if (req.file) {
          updatedCategory.image = `${process.env.S3_BUCKET_URL}/${req.file.key}`;
        }

        const category = await Category.findByIdAndUpdate(
          req.params.id,
          updatedCategory,
          { new: true }
        );

        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }

        res.json(category);
      } catch (err) {
        console.error('Error during category update:', err);
        res.status(400).json({ message: err.message });
      }
    }
  });
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error('Error during category deletion:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.countCourses = async (req, res) => {
  try {
    const categoryId = req.query.categoryId;
    const courseCount = await Course.countDocuments({ categorys: categoryId });

    res.json({ count: courseCount });
  } catch (error) {
    console.error("Erreur lors du comptage des cours :", error);
    res.status(500).json({ error: "Une erreur est survenue lors du comptage des cours" });
  }
};
exports.countCoursesByCategory = async (req, res) => {
  try {
   
    const categories = await Category.find().populate({
      path: 'courses',
      populate: { path: 'paiements' }
    });

  
    const categoryPaymentCounts = categories.map(category => {
      const paymentCount = category.courses.reduce((acc, course) => acc + course.paiements.length, 0);
      return {
        categoryName: category.name,
        paymentCount
      };
    });

    categoryPaymentCounts.sort((a, b) => b.paymentCount - a.paymentCount);

    const topCategories = categoryPaymentCounts.slice(0, 5);

    res.json({ topCategories });
  } catch (error) {
    console.error("Erreur lors du comptage des paiements par catégorie :", error);
    res.status(500).json({ error: "Une erreur est survenue lors du comptage des paiements par catégorie" });
  }
};
