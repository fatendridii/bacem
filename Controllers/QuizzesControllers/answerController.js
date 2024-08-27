
const Question = require("../../Models/quizzes/question");
const Answer = require("../../Models/quizzes/answer");


exports.createAnswer = async (req, res) => {
    const { answerText, isCorrect ,  questionId } = req.body;
    try {
     const question = await Question.findById(questionId);
      if (!question) {
        return res
          .status(404)
          .json({ message: "Le question spécifié n'existe pas." });
      }
      const answer = new Answer({
        answerText,
        isCorrect,
        question: [question._id]
      });

      const newAnswer = await answer.save();
      res.status(201).json(newAnswer);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }

};




