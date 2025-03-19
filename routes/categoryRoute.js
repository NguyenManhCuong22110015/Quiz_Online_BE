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

export async function getIdByName(name) {
  try {
    const categories = await Category.find({ name: name });
    
    if (categories && categories.length > 0) {
      console.log("Found category:", categories[0]);
      return categories[0]._id;
    } else {
      console.log("No category found with name:", name);
      return null;
    }
  } catch (error) {
    console.error("Error finding category by name:", error.message);
    throw error; 
  }
}



export default router;