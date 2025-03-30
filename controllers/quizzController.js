import Question from '../models/Question.js'; 


export const getAllQuestions = async (req, res) => {
    try {
            const quizId = req.body.quizId; 
            const questions = await Question.find({ quizId: quizId });
            res.json(questions);
    } catch (error) {
            res.status(500).json({ message: error.message });
    }
}


    