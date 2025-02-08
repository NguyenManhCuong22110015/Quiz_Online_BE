import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  quizId: { type: String },
  userId: { type: String },
  score: {type: double},
  totalQuestions: {type: Int32Array},
  submittedAt: { type: Date, default: Date.now },
});

// Đảm bảo tên collection là 'users'
export default mongoose.model('Result', userSchema, 'results');
