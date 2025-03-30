import  { Router } from 'express';
import { initializeResult, checkProcess , addAnswerToResult, getTopTenPlayers} from '../controllers/resultController.js';
const router = Router();

router.post('/create', initializeResult );

router.post('/check-process', checkProcess);

router.put('/add-answer', addAnswerToResult);

router.get("/top-ten-players", getTopTenPlayers);

export default router;