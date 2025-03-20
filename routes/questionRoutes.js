import { Router } from 'express';
import { getAllQuestions, getQuestionById, createQuestion, getQuestionsByQuizzId, updateQuestion } from '../controllers/questionController.js';


const router = Router();


router.get('/',getAllQuestions );

router.get('/byId', getQuestionById);

router.post('/',createQuestion);

router.get('/getQuestionsByQuizzId', getQuestionsByQuizzId); 

router.post('/create', createQuestion);

router.put('/update', updateQuestion);



export default router;