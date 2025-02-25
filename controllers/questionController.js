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

export const getQuestionById = async (req, res) => {
    try {
        const quesId = req.query.quesId; 
        const questions = await Question.find({ _id: quesId });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const createQuestion = async (req, res) => {
    const question = new Question({
        quizId: req.body.quizId,
        type: req.body.type,
        text: req.body.text,
        options: req.body.options,
    });
   try {
    const newQuestion = await Question.create(question);
    res.json(newQuestion);
   }
   catch(err){
    console.log(err);
   }
}


export const getQuestionsByQuizzId = async (req, res) => {
    try {
        const quizId = req.query.quizId; 
        console.log(quizId);
        const questions = await Question.find({ quizId: quizId });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


