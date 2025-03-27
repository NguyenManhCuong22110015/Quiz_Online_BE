import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id : {type : mongoose.Schema.Types.ObjectId},
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  score :{type : Number , default : 0},
  startTime: {type : Date, default : Date.now},
  endTime: {type : Date, default : Date.now},
  attempt : {type : Number, default : 0},
  status : {type : String, default : 'PENDING', enum : ['PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED']},
  UserAnswwer : {type : Array, default : [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
      answer: { type: String },
      isCorrect: { type: Boolean, default: false },
      points: { type: Number, default: 100 },
      timeTaken: { type: Number, default: 0 }
    }
  ]},
});

export default mongoose.model('Result', userSchema, 'results');
