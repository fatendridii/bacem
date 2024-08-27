const mongoose = require('mongoose');
const Quiz = require("../../Models/quizzes/quiz");
const UserResult = require("../../Models/quizzes/userResultQuiz");
const User = require("../../Models/user");
const Question = require("../../Models/quizzes/question");
const Answer = require("../../Models/quizzes/answer");
const UserAnswer = require("../../Models/quizzes/userAnswer");

exports.createUserResult = async (req, res) => {
  const { quizId, userId, answers } = req.body;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Le quiz spécifié n'existe pas." });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "L'utilisateur spécifié n'existe pas." });
    }

    let score = 0;

    for (const userAnswer of answers) {
      const { question_id, selected_answer_id } = userAnswer;
      const questionObjectId = new mongoose.Types.ObjectId(question_id);
      const selectedAnswerObjectId = new mongoose.Types.ObjectId(selected_answer_id);

      const question = await Question.findById(questionObjectId);
      if (!question) {
        console.log(`Question not found for question_id: ${question_id}`);
        continue;
      }

      const correctAnswer = await Answer.findOne({ question: questionObjectId, isCorrect: true });

      if (!correctAnswer) {
        console.log(`Correct answer not found for question_id: ${question_id}`);
        continue;
      }
      console.log(`Correct answer ID: ${correctAnswer._id.toString()}, Selected answer ID: ${selectedAnswerObjectId.toString()}`);

      if (correctAnswer._id.equals(selectedAnswerObjectId)) {
        score++;
        console.log(`Correct answer selected for question_id: ${question_id}`);
      } else {
        console.log(`Incorrect answer selected for question_id: ${question_id}`);
      }
      const newUserAnswer = new UserAnswer({
        user_id: userId,
        question_id: questionObjectId,
        selected_answer_id: selectedAnswerObjectId
      });

      await newUserAnswer.save();
    }

    const passed = (score / answers.length) >= 0.7;
    const userResult = new UserResult({
      score: score,
      passed: passed,
      quiz: quiz._id,
      user: user._id
    });
    const newUserResult = await userResult.save();
    user.userResults.push(newUserResult._id);
    await user.save();



    res.status(201).json(newUserResult);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};
exports.getUserResultByUserAndQuiz = async (req, res) => {
  try {
    const { userId, quizId } = req.params;
    const userResult = await UserResult.find({ user: userId, quiz: quizId })
      .sort({ createdAt: -1 })
      .limit(1)
      .populate('user')
      .populate('quiz');

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ message: "User result not found for the specified user and quiz" });
    }

    const questionCount = await Question.countDocuments({ quiz: quizId });

    const resultWithQuestionCount = {
      ...userResult[0]._doc,
      questionCount
    };

    res.json(resultWithQuestionCount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getAllQuizResults = async (req, res) => {
    try {
    
      const results = await UserResult.find({}).populate('user').populate('quiz');
      const resultsWithQuestionCount = await Promise.all(results.map(async (result) => {
        const quizId = result.quiz[0]._id; 
        const questionCount = await Question.countDocuments({ quiz: quizId });
  
        return {
          ...result._doc,
          questionCount
        };
      }));
  
      res.json(resultsWithQuestionCount);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.analyzeQuizScores = async (req, res) => {
    const quizId = req.params.quizId;
  
    try {
    
      const results = await UserResult.find({ quiz: quizId }).populate('user').populate('quiz');
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'Aucun résultat trouvé pour ce quiz.' });
      }
  
      const questionCount = await Question.countDocuments({ quiz: quizId });
      
      if (questionCount === 0) {
        return res.status(404).json({ message: 'Le quiz spécifié n\'a pas de questions.' });
      }
  
      const scorePercentages = results.map(result => {
        const scorePercentage = (result.score / questionCount) * 100;
        return scorePercentage;
      });
  
      const validScores = scorePercentages.filter(score => !isNaN(score) && score >= 0);
  
      if (validScores.length === 0) {
        return res.status(404).json({ message: 'Aucun score valide trouvé.' });
      }
  
      const averageScore = validScores.reduce((acc, score) => acc + score, 0) / validScores.length;
      const minScore = Math.min(...validScores);
      const maxScore = Math.max(...validScores);
  
      const passedCount = results.filter(result => result.passed).length;
      const failedCount = results.length - passedCount;
  
      const statistics = {
        averageScore: averageScore.toFixed(2),
        minScore: minScore.toFixed(2),
        maxScore: maxScore.toFixed(2),
        passedCount: passedCount,
        failedCount: failedCount,
        scorePercentages: scorePercentages
      };
  
      res.json(statistics);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };