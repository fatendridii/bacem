const Quiz = require("../../Models/quizzes/quiz");
const Course = require("../../Models/course");
const Question = require("../../Models/quizzes/question");
const Answer = require("../../Models/quizzes/answer");

exports.createQuiz = async (req, res) => {
    const { title, courseId } = req.body;
    try {
     
      const course = await Course.findById(courseId);
      if (!course) {
        return res
          .status(404)
          .json({ message: "Le cours spécifié n'existe pas." });
      }
      const quiz = new Quiz({
        title,
        course: [course._id]
      });

      const newQuiz = await quiz.save();

      course.quiz.push(newQuiz._id);
      await course.save();
  

      res.status(201).json(newQuiz);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }

};

exports.getQuizByCourse = async (req, res) => {

  try {
    const courseId = req.params.courseId;
    const quiz = await Quiz.findOne({ course: courseId }).exec();
    if (!quiz) {
        return res.status(404).json({ message: 'Quiz non trouvé pour ce cours' });
    }
    const questions = await Question.find({ quiz: quiz._id }).exec();
    const questionsWithAnswers = await Promise.all(questions.map(async question => {
        const answers = await Answer.find({ question: question._id }).exec();
        return {
            ...question._doc,
            answers
        };
    }));

    res.json({
        ...quiz._doc,
        questions: questionsWithAnswers
    });
} catch (error) {
    res.status(500).json({ message: error.message });
}
};

exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



