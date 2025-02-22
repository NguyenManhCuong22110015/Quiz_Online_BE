import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  createAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Đảm bảo tên collection là 'users'
export default mongoose.model('Quizze', userSchema, 'quizzes');
