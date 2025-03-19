import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId } ,
    type: { type: String },
    text: {type: String},
    options: {type: Array},
    layout: {type: String},
    point: {type: Number},
    time: {type: Number},
    description: {type: String},
    media: {type: String, default: ''},
  createAt: { type: Date, default: Date.now },
});

// Đảm bảo tên collection là 'users'
export default mongoose.model('Question', userSchema, 'questions');
