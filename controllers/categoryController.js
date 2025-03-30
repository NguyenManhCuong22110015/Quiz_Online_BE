import Category from '../models/Category.js';

export const getAllCategory = async (req, res) => {
     try {
       
        const category = await Category.find();
        res.json(category);
      }
      catch (error) {
        res.status(500).json({ message: error.message });
      }
    
};

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

// Create a new category

export const createCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const newCategory = new Category({
            name: name,
            description: description,
        });
        const savedCategory = await newCategory.save();
        res.status(201).json(savedCategory); 
    } catch (error) {
        res.status(500).json({ message: error.message }); 
    }
}

// 
// Update an existing category

export  const updateCategory = async (req, res) => {
    const {id} = req.params;
    const { name, description } = req.body;

  

    try {
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name: name, description: description },
            { new: true }
        );

        console.log("Updated category:", updatedCategory);
        res.json(updatedCategory); 
    } catch (error) {
        res.status(500).json({ message: error.message }); 
    }
}

// Delete a category

export const deleteCategory = async (req, res) => {
    const { id } = req.body;
    try {
        await Category.findByIdAndDelete(id);
        res.json({ message: "Category deleted successfully" }); 
    } catch (error) {
        res.status(500).json({ message: error.message }); 
    }
}

// Get a categoty by Id 

export const getCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.json(category); 
    } catch (error) {
        res.status(500).json({ message: error.message }); 
    }
}