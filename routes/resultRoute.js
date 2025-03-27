import  { Router } from 'express';
import { initializeResult, checkProcess , addAnswerToResult} from '../controllers/resultController.js';
const router = Router();

router.post('/create', initializeResult );

router.post('/check-process', checkProcess);

router.put('/add-answer', addAnswerToResult);



export default router;