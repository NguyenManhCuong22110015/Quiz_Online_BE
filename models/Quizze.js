import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  description: { type: String, default:"" },
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  createAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  category: {type :mongoose.Schema.Types.ObjectId, ref:'Category'},
  image: {type: String, default:null},
  level: {type: String, default: 'easy'},
  rating: {type: Number, default: 0},
  published: {type: Boolean, default: false},
});

// Đảm bảo tên collection là 'users'
export default mongoose.model('Quizze', userSchema, 'quizzes');
