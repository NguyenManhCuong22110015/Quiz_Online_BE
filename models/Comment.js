import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId } ,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message : {type: String},
  createdAt: { type: Date, default: Date.now },
});

// Đảm bảo tên collection là 'users'
export default mongoose.model('Comment', userSchema, 'comments');
