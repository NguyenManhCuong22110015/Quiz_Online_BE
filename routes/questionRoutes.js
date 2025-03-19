import { Router } from 'express';
import { getAllQuestions, getQuestionById, createQuestion, getQuestionsByQuizzId } from '../controllers/questionController.js';

const router = Router();


router.get('/',getAllQuestions );

router.get('/byId', getQuestionById);

router.post('/',createQuestion);

router.get('/getQuestionsByQuizzId', getQuestionsByQuizzId); 

router.post('/create', createQuestion);


export default router;