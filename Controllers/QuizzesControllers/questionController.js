const Quiz = require("../../Models/quizzes/quiz");
const Question = require("../../Models/quizzes/question");


exports.createQuestion = async (req, res) => {
    const { questionText, quizId } = req.body;
    try {
     
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res
          .status(404)
          .json({ message: "Le quiz spécifié n'existe pas." });
      }
      const question = new Question({
        questionText,
        quiz: [quiz._id]
      });

      const newQuestion = await question.save();
      res.status(201).json(newQuestion);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }

};




