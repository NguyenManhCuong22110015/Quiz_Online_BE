import Result from "../models/Result.js";

export const initializeResult = async (req, res) => {
    try {
        const { userId, quizId } = req.body;
        const result = await Result.create({ user: userId, quiz: quizId });
        console.log(result);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const checkProcess = async (req, res) => {
    try {
        const { userId, quizId } = req.body;
        console.log(userId + "  :  " + quizId);
        const result = await Result.findOne({ user: userId, quiz: quizId, status: 'PENDING' });
        if (result) {
            res.json(result);
        }
        else
            {
                res.json(null);
            }

    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};    

export const addAnswerToResult = async (req, res) => {
    try {
        const { resultId, answers, completed } = req.body;
        console.log("Id: "+ resultId);
        console.log("Received answers to save:", answers);
        
        const result = await Result.findById(resultId);
        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }
        
        // Tạo Map từ câu trả lời hiện tại để dễ dàng kiểm tra trùng lặp
        const existingAnswersMap = {};
        if (result.UserAnswwer && result.UserAnswwer.length > 0) {
            result.UserAnswwer.forEach(answer => {
                if (answer.question) {
                    existingAnswersMap[answer.question.toString()] = answer;
                }
            });
        }
        
        // Mảng để lưu các câu trả lời đã cập nhật
        const updatedAnswers = [...result.UserAnswwer];
        
        // Xử lý từng câu trả lời mới
        for (const newAnswer of answers) {
            const questionId = newAnswer.questionId.toString();
            
            // Kiểm tra xem câu trả lời đã tồn tại chưa
            if (existingAnswersMap[questionId]) {
                // Nếu đã tồn tại, cập nhật câu trả lời
                const index = updatedAnswers.findIndex(
                    ans => ans.question && ans.question.toString() === questionId
                );
                
                if (index !== -1) {
                    updatedAnswers[index] = {
                        question: newAnswer.questionId,
                        answer: newAnswer.selectedOption,
                        isCorrect: newAnswer.isCorrect,
                        points: newAnswer.points,
                        timeTaken: newAnswer.timeTaken
                    };
                }
            } else {
                updatedAnswers.push({
                    question: newAnswer.questionId,
                    answer: newAnswer.selectedOption,
                    isCorrect: newAnswer.isCorrect,
                    points: newAnswer.points,
                    timeTaken: newAnswer.timeTaken
                });
            }
        }
        
        let totalScore = 0;
        updatedAnswers.forEach(answer => {
            if (answer.isCorrect) {
                totalScore += answer.points || 100;
            }
        });
        
        result.UserAnswwer = updatedAnswers;
        result.score = totalScore;
        
        if (completed) {
            result.status = 'COMPLETED';
            result.endTime = new Date();
        }
        
        await result.save();
        
        res.status(200).json({
            message: "Answers saved successfully",
            result: {
                id: result._id,
                score: result.score,
                status: result.status,
                answers: result.UserAnswwer
            }
        });
    } catch (error) {
        console.error("Error adding answers:", error);
        res.status(500).json({ message: error.message });
    }
};