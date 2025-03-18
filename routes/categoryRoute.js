import { Router } from 'express';
import Category from '../models/Category.js';

const router = Router();
router.get("/getAll", async (req, res) => {
  try {
   
    const category = await Category.find();
    res.json(category);
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }

});





export default router;