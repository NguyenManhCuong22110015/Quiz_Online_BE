import { Router } from 'express';
import Quizze from '../models/Quizze.js';

const router = Router();

router.get('/getByUserId', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const quizze = await Quizze.find({ createdBy: userId }); 
    res.json(quizze);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/getAll', async (req, res) => {
  try {
    const { userId } = req.query;
    const quizze = await Quizze.find({ 
      createdBy: { $ne: userId } 
    }); 
   
    res.json(quizze);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post("/create", async (req, res) => {
  const { title, description, createdBy } = req.body;
  const quizze = new Quizze({
    title,
    description,
    createdBy,
  });
  try {
    const newQuizze = await quizze.save();
    res.status(201).json(newQuizze);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});






export default router;