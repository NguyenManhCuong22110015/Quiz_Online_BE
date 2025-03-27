import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId } ,
    type: { type: String },
    text: {type: String},
    options: {type: Array, default: []},
    layout: {type: String , default: ''},
    point: {type: Number , default:1},
    time: {type: Number, default: 1},
    description: {type: String, default: ''},
    media: {type: String, default: ''},
    mediaType: {type: String, default: ''},
  createAt: { type: Date, default: Date.now },
});

// Đảm bảo tên collection là 'users'
export default mongoose.model('Question', userSchema, 'questions');
