import Result from "../models/Result.js";
import mongoose from 'mongoose';
import User from "../models/User.js";

export const initializeResult = async (req, res) => {
    try {
        const { quizId, userId } = req.body;
        
        const existingResult = await Result.findOne({ 
            quizz: quizId,
            user: userId,
            status: 'PENDING'
        });
        
        if (existingResult) {
            console.log("Found existing PENDING result, returning it");
            return res.status(200).json(existingResult);
        }
        
        const newResult = new Result({
            quiz: quizId,
            user: userId,
            startTime: new Date(),
            status: 'PENDING',
            score: 0,
            UserAnswer: []
        });
        
        await newResult.save();
        res.status(201).json(newResult);
    } catch (error) {
        console.error("Error creating result:", error);
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
        console.log("Received answers to save:", req.body);
        
        const result = await Result.findById(resultId);
        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }
        
        // Tạo Map từ câu trả lời hiện tại để dễ dàng kiểm tra trùng lặp
        const existingAnswersMap = {};
        if (result.UserAnswers && result.UserAnswers.length > 0) {
            result.UserAnswers.forEach(answer => {
                if (answer.question) {
                    existingAnswersMap[answer.question.toString()] = answer;
                }
            });
        }
        
        // Mảng để lưu các câu trả lời đã cập nhật
        const updatedAnswers = [...result.UserAnswers];
        
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
                        points: newAnswer.points || 100,
                        timeTaken: newAnswer.timeTaken || 0
                    };
                }
            } else {
                // Nếu là câu trả lời mới, thêm vào danh sách
                updatedAnswers.push({
                    question: newAnswer.questionId,
                    answer: newAnswer.selectedOption,
                    isCorrect: newAnswer.isCorrect,
                    points: newAnswer.points || 100,
                    timeTaken: newAnswer.timeTaken || 0
                });
            }
        }
        
        let totalScore = 0;
        updatedAnswers.forEach(answer => {
            if (answer.isCorrect === true) {
                const points = parseInt(answer.points || 100);
                if (!isNaN(points)) {
                    totalScore += points;
                }
            }
        });
        
        result.UserAnswers = updatedAnswers;
        result.score = totalScore; // Đảm bảo totalScore là số
        
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
                answers: result.UserAnswers.map(ans => ({
                    questionId: ans.question,
                    selectedOption: ans.answer,
                    isCorrect: ans.isCorrect,
                    points: ans.points || 100
                }))
            }
        });
    } catch (error) {
        console.error("Error adding answers:", error);
        res.status(500).json({ message: error.message });
    }
};


export const getTopTenPlayers = async (req, res) => {
    try {
            const quizId = req.query.quizId; 
           
            const results = await Result.aggregate([
                {
                    $match:{
                        quiz: new mongoose.Types.ObjectId(quizId), 
                        //status: 'COMPLETED'                        
                    }
                },
                {
                    $group:{
                        _id: "$user",
                        score : {$max: "$score" },
                        quiz : {$first: "$quiz"},
                        resultId : {$first: "$_id"},
                        endTime : {$first: "$endTime"}
                    }
                },
                {
                    $sort:{
                        score : -1
                    }
                },
                {
                    $limit: 10
                }
            ]);


            const toptenPlayers = await Promise.all(results.map(async (result) => {
                try {
                    const user = await User.findById(result._id).select("name email").lean();
                    if (!user) {
                        return null; // Hoặc xử lý theo cách bạn muốn
                    }

                    return {
                        userId: result._id,
                        quizId: result.quiz,
                        score: result.score,
                        resultId: result.resultId,
                        name: user.name,
                        email: user.email,
                        endTime: result.endTime,
                    }

                }
                catch(error){
                    console.error("Error fetching user data:", error);
                    return null;
                }
            } ))

            .then(results => results.filter(result => result !== null));



            res.json(toptenPlayers);
    } catch (error) {
            res.status(500).json({ message: error.message });
    }
}
