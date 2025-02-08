import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String },
    description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Đảm bảo tên collection là 'users'
export default mongoose.model('Category', userSchema, 'categories');
