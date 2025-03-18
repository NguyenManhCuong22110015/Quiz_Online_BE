import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, default: null },
  authId: { type: String , default: null},
  authProvider: { type: String , default: null},
  password: {type: String, default: null},
  role: {type: String , default: 'user'},
  createAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
