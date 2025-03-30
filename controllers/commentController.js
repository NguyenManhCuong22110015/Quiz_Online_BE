import Comment from '../models/Comment.js';
import User from '../models/User.js';

export const getCommentByQuizzId = async (req, res) => {
    try {
        const quizId = req.query.quizId; 
        const comments = await Comment.find({ quizId: quizId }); 
        const response = await Promise.all(comments.map(async (comment) => {
            const user = await User.findById(comment.userId); 
            return {
                ...comment._doc,
                userName: user.name,
                
            };
        }
        ));
        
        res.json(response); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const createComment = async (req, res) => {
    const { quizId, userId, message } = req.body; 
    try {
        const comment = new Comment({
            quizId: quizId,
            userId: userId,
            message: message,
        });
        const savedComment = await comment.save();
        res.status(201).json(savedComment); 
    } catch (error) {
        res.status(500).json({ message: error.message }); 
    }
}