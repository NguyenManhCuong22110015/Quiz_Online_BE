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
  UserAnswers: [{
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',

    },
    answer: {
        type: String
    },
    isCorrect: {
        type: Boolean,
        default: false
    },
    points: {
        type: Number,
        default: 0
    },
    timeTaken: {
        type: Number,
        default: 0
    }
}]
}, {
toJSON: { 
    transform: function(doc, ret) {
        if (ret.UserAnswers) {
            ret.UserAnswers = ret.UserAnswers.filter(answer => 
                typeof answer === 'object' && 
                answer !== null && 
                answer.question !== undefined
            );
        }
        return ret;
    }
}
});


export default mongoose.model('Result', userSchema, 'results');
