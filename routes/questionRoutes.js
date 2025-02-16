import { Router } from 'express';
import { getAllQuestions, getQuestionById, createQuestion } from '../controllers/questionController.js';

const router = Router();


router.get('/',getAllQuestions );

router.get('/byId', getQuestionById);

router.post('/',createQuestion);


export default router;