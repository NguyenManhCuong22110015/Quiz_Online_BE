import { Router } from 'express';
import Question from '../models/Question.js'; 
const router = Router();
import mongoose from 'mongoose';
router.get('/', async (req, res) => {
    try {
        const quizId = req.body.quizId; // Lấy quizId từ body
       
        const questions = await Question.find({ quizId: quizId });

        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/byId', async (req, res) => {
    try {
        const quesId = req.query.quesId; 
       
        const questions = await Question.find({ _id: quesId });

        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



router.post('/', async (req, res) => {

    const question = new Question({
        quizId: req.body.quizId,
        type: req.body.type,
        text: req.body.text,
        options: req.body.options,
    });

   try {
    const newQuestion = await Question.create(question);
    res.json(newQuestion);
   }
   catch(err){
    console.log(err);
   }


});


export default router;