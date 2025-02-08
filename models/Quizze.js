import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  createdBy: {type: String},
  createAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Đảm bảo tên collection là 'users'
export default mongoose.model('Quizze', userSchema, 'quizzes');
