import { Router } from 'express';
const router = Router();
import User from '../models/User.js';

// API: Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({});
   
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// API: Add a new user
router.post('/', async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
  });
  try {
    const newUser = await user.save();
    
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


router.post('/del', async (req, res) => {
  const { id } = req.body;  // Use req.body to get the id
  
  try {
    const user = await User.findById(id);  // Find the user by id
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(id);  // Delete the user

    res.status(200).json({ message: 'User deleted successfully' });  // Send success response
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
