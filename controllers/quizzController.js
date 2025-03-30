import Question from '../models/Question.js'; 
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

import {cloudinary} from '../config/cloudinary.js';
import {generateQuiz} from "../services/generateQuizService.js"

export const getAllQuestions = async (req, res) => {
    try {
            const quizId = req.body.quizId; 
            const questions = await Question.find({ quizId: quizId });
            res.json(questions);
    } catch (error) {
            res.status(500).json({ message: error.message });
    }
}

export const getByUserId = async (req, res) => {
        try {
            const { userId } = req.query;
            
            const quizze = await Quizze.find({ createdBy: userId }); 
            res.json(quizze);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
}
    
export const getById = async (req, res) => {
        try {
            const { id } = req.query;   
            const quizze = await Quizze.find({ _id: id }).findOne(); 
            res.json(quizze);
          } catch (error) {
            res.status(500).json({ message: error.message });
        }

}

export const getAll = async (req, res) => {
        try {
            const { userId } = req.query;
            const quizze = await Quizze.find({ 
              createdBy: { $ne: userId } 
            }); 
           
            res.json(quizze);
          } catch (error) {
            res.status(500).json({ message: error.message });
          }
}

export const getByCategory = async (req, res) => {
        try {
        
            const category = req.query.category;
            const quizze = await Quizze.find({ category: category });
            res.json(quizze);
          }
          catch (error) {
            res.status(500).json({ message: error.message });
          }
        
}


export const createQuizze = async (req, res) => {
        const { title, description, category, level, createdBy, imageUrl } = req.body;
        
        
          const categoryId = await getIdByName(category) 
          
          try {
            const quizze = new Quizze({
              title:title,
              description:description,
              category:categoryId,
              image: imageUrl || '', 
              level:level,
              createdBy:createdBy,
            });
            
            const newQuizze = await quizze.save();
            res.status(201).json(newQuizze);
          } catch (error) {
            res.status(400).json({ message: error.message });
          }
}


export const  deleteImage = async (req, res) => {
        try {
            const { publicId } = req.params;
            
            const result = await cloudinary.uploader.destroy(publicId);
            
            if (result.result === 'ok') {
              return res.json({ message: 'Image deleted successfully' });
            } else {
              return res.status(400).json({ message: 'Failed to delete image' });
            }
          } catch (error) {
            console.error("Error deleting image:", error);
            res.status(500).json({ message: error.message });
          }
}

export const updateQuizze = async (req, res) => {
        const { title, description, category, level, image } = req.body;
        ;
          const { id } = req.params;
          try {
            const quizze = await Quizze.findById(id); 
            if (title) quizze.title = title;
            if (description) quizze.description = description;
            if (category) quizze.category = category;
            if (level) quizze.level = level;
            if (image) quizze.image = image;
            quizze.updatedAt = new Date();
            const updatedQuizze = await quizze.save();
            res.json(updatedQuizze);
          } catch (error) {
            res.status(400).json({ message: error.message });
          }
}

export const generateQuizze = async (req, res) => {
         try {
            const prompt = req.body.prompt;
            const quizData = await generateQuiz(prompt);
            
            res.json({
              questions: quizData.questions || [],
              topicImage: quizData.topicImage || null
            });
          } catch (error) {
            console.error("Error generating quiz:", error);
            res.status(500).json({ message: error.message });
          }
}