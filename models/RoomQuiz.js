import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        default: null
    },
    maxPlayers: {
        type: Number,
        required: true,
        default: 4
    },
    currentPlayers: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    QuizzIds:  {
        type: Array,
        default:[]
    }
});

export default mongoose.model('Room', roomSchema);