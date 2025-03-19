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
    const data = req.body;
    try {
        if (Array.isArray(data)) {
            
            const newQuestions = await Promise.all(
                data.map(async (questionData) => {
                    const question = new Question({
                        quizId: questionData.quizId,
                        type: questionData.type,
                        text: questionData.question, 
                        layout: questionData.layout,
                        points: questionData.points, 
                        time: questionData.time,
                        media: questionData.mediaUrl ? questionData.mediaUrl : "",
                        description: questionData.description,
                        options: questionData.options,
                    });
                    
                    return question.save();
                })
            );
            res.status(201).json(newQuestions);
        }        
        else {
            console.log('Invalid question data received');
            res.status(400).json({ message: "Invalid question data" });
        }
    } catch (error) {
        console.error('Error creating question(s):', error);
        res.status(500).json({ message: error.message });
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


