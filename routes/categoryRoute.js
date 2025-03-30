import { Router } from 'express';

import { createCategory, deleteCategory, getAllCategory, getCategoryById, updateCategory } from '../controllers/categoryController.js';

const router = Router();
router.get("/getAll", getAllCategory);

router.post("/create",  createCategory )

router.put("/update/:id", updateCategory)

router.delete("/delete/:id", deleteCategory)

router.get("/getIdById", getCategoryById)



export default router;