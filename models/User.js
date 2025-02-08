import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  password: {type: String},
  role: {type: String},
  createAt: { type: Date, default: Date.now },
});

// Đảm bảo tên collection là 'users'
export default mongoose.model('User', userSchema, 'users');
