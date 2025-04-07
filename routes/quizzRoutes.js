import { Router } from 'express';
import Quizze from '../models/Quizze.js';
import { cloudinary } from '../config/cloudinary.js';
import {getIdByName} from "../controllers/categoryController.js"
import {generateQuiz, generateQuizFromPDF} from '../services/generateQuizService.js'
import multer from 'multer';
import Question from '../models/Question.js';
import { fetchImage } from '../config/googleSearch.js';
import { getDetailById } from '../controllers/quizzController.js';

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


router.get('/getById', async (req, res) => {
  try {
    const { id } = req.query;
    
    const quizze = await Quizze.find({ _id: id }).findOne(); 
    res.json(quizze);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/getDetailById', getDetailById);


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
// router.post("/create", async (req, res) => {
//   const { title, description, createdBy } = req.body;
//   const quizze = new Quizze({
//     title,
//     description,
//     createdBy,
//   });
//   try {
//     const newQuizze = await quizze.save();
//     res.status(201).json(newQuizze);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });


router.get("/getByCategory", async (req, res) => {
  try {

    const category = req.query.category;
    const quizze = await Quizze.find({ category: category, published: true });
    res.json(quizze);
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }

});



router.post("/create", async (req, res) => {
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
});

router.delete('/delete-image/:publicId', async (req, res) => {
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
});


router.put("/update/:id", async (req, res) => {
  const { title, description, category, level, image, published } = req.body;

  

  const { id } = req.params;
  try {
    const quizze = await Quizze.findById(id); 
    if (title) quizze.title = title;
    if (description) quizze.description = description;
    if (category) quizze.category = category;
    if (level) quizze.level = level;
    if (image) quizze.image = image;
    if (published !== undefined) quizze.published = published;
    quizze.updatedAt = new Date();
    const updatedQuizze = await quizze.save();
    res.json(updatedQuizze);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const quizData = await generateQuiz(prompt);
    
    // Giả sử generateQuiz đã gọi generateQuizGroqToJSON và lấy dữ liệu hình ảnh
    res.json({
      questions: quizData.questions || [],
      topicImage: quizData.topicImage || null
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    res.status(500).json({ message: error.message });
  }
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/generate-quizzes-by-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    
    if (!Buffer.isBuffer(fileBuffer)) {
      return res.status(400).json({ error: 'Invalid file format' });
    }

    const maxSize = 60 * 1024 * 1024; // 60MB
    if (fileBuffer.length > maxSize) {
      return res.status(400).json({ error: 'File is too large. Maximum size is 60MB.' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed.' });
    }

    const quizzes = await generateQuizFromPDF(fileBuffer);
    
    if (!quizzes || quizzes.length === 0) {
      return res.status(400).json({ error: 'Could not generate quizzes from PDF.' });
    }
    


    return res.json(quizzes);
  } catch (error) {
    console.error("❌ Error processing PDF:", error);
    return res.status(500).json({ 
      error: 'Failed to process PDF file',
      details: error.message 
    });
  }
});


router.put("/save-questions/:id", async (req, res) => {
  const { allQuestions } = req.body;
  const { id } = req.params;
  try {
    const savedQuestions = await Promise.all(
      allQuestions.map(async (question) => {
        let options = [];
        
        if (question.choices && Array.isArray(question.choices)) {
          options = question.choices.map(choice => {
            if (typeof choice === 'object' && 'text' in choice && 'isCorrect' in choice) {
              return {
                option: choice.text,
                isCorrect: choice.isCorrect
              };
            }
            else if (typeof choice === 'string') {
              return {
                option: choice,
                isCorrect: false
              };
            }
            return choice;
          });
        }
        
        console.log("Saving question:", {
          type: question.type || 'multiple-choice',
          text: question.question || question.text,
          options: options
        });
        
        const newQuestion = new Question({
          type: question.type || 'multiple-choice',
          text: question.question || question.text,
          options: options,
          quizId: id
        });
        
        return await newQuestion.save();
      })
    );
    
    console.log(`Saved ${savedQuestions.length} questions successfully`);
    
    // Cập nhật quiz với các câu hỏi mới
    await Quizze.findByIdAndUpdate(id, {
      $push: { questions: { $each: savedQuestions.map(q => q._id) } },
      updatedAt: new Date()
    });
    
    res.json({ message: 'Questions saved successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/test", async function(req, res) {
  let imageBase64;
  try {
    try {
           
      imageBase64 = await fetchImage('naruto')
   } catch (imageError) {
       console.error('Image generation failed:', imageError);
   }
  
   res.json({ 
      image: imageBase64 ,
       
   });
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }

})


export default router;