import { Router } from 'express';
const router = Router();
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


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
router.get("/session", (req, res) => {
  if (req.session.user) {
      res.json({ loggedIn: true, user: req.session.user });
  } else {
      res.json({ loggedIn: false });
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user and select necessary fields
    const user = await User
      .findOne({ email: email })
      .select("_id name email password role");

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid password" 
      });
    }
    req.session.user = { 
      name: user.name,
      
    };


    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});


router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
        // Create new user
    const user = new User({
      name:"user",
      email,
      password: hashedPassword,
      role:"user"
    });

    await user.save();
   
    res.status(201).json({
      success: true,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});


export default router;
