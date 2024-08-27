
const Question = require("../../Models/quizzes/question");
const Answer = require("../../Models/quizzes/answer");
const User = require("../../Models/user");
const UserAnswer = require("../../Models/quizzes/userAnswer");

exports.createUserAnswer = async (req, res) => {
    const { userId, questionId ,  selectedAnswerId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
          return res
            .status(404)
            .json({ message: "L'utilisateur spécifié n'existe pas." });
        }

     const question = await Question.findById(questionId);
      if (!question) {
        return res
          .status(404)
          .json({ message: "Le question spécifié n'existe pas." });
      }

      const selectedAnswer = await Answer.findById(selectedAnswerId);
      if (!selectedAnswer) {
        return res
          .status(404)
          .json({ message: "La réponse spécifié n'existe pas." });
      }

      const userAnswer = new UserAnswer({
        user: [user._id],
        question: [question._id],
        selectedAnswer: [selectedAnswer._id]
      });

      const newUserAnswer = await userAnswer.save();
      res.status(201).json(newUserAnswer);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }

};




