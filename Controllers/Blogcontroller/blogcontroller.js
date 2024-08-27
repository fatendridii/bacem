const Blog = require("../../Models/blog");
const { uploadSingleImage } = require("../../Utilis/uploadImageUtil");
require('dotenv').config();

exports.createBlog = async (req, res) => {
  uploadSingleImage(req, res, async (err) => {
    if (err) {
      res.status(400).json({ message: err });
    } else {
      const { titre, dateCreation, sousTitre, contenu } = req.body;
      const image = req.file ? `${process.env.S3_BUCKET_URL}/${req.file.key}` : "";

      const blog = new Blog({
        titre: titre,
        sousTitre: sousTitre,
        dateCreation: dateCreation,
        contenu: contenu,
        image: image,
      });

      try {
        const newBlog = await blog.save();
        res.status(201).json(newBlog);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    }
  });
};

exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();
    const updatedBlogs = blogs.map(blog => ({
      ...blog._doc,
      image: `${blog.image}` 
    }));
    res.json(updatedBlogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const prevBlog = await Blog.findOne({ _id: { $lt: req.params.id } }).sort({ _id: -1 }).limit(1);
    const prevId = prevBlog ? prevBlog._id : null;

    const nextBlog = await Blog.findOne({ _id: { $gt: req.params.id } }).sort({ _id: 1 }).limit(1);
    const nextId = nextBlog ? nextBlog._id : null;

    const updatedBlog = {
      ...blog._doc,
      image: `${blog.image}`   };

    res.json({ blog: updatedBlog, prevId, nextId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateBlogById = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      res.status(400).json({ message: err });
    } else {
      try {
        const updatedBlog = {
          titre: req.body.titre,
          sousTitre: req.body.sousTitre,
          dateCreation: req.body.dateCreation,
          contenu: req.body.contenu,
        };

        if (req.file) {
          updatedBlog.image = `${process.env.S3_BUCKET_URL}/${req.file.key}`;
        }

        const blog = await Blog.findByIdAndUpdate(
          req.params.id,
          updatedBlog,
          { new: true }
        );

        if (!blog) {
          return res.status(404).json({ message: "Blog not found" });
        }

        res.json(blog);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    }
  });
};

exports.deleteBlogById = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json({ message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
