import { Router } from 'express';
import { createComment, getCommentByQuizzId } from '../controllers/commentController.js';

const router = Router();



router.get('/getByQuizzId',getCommentByQuizzId );

router.post('/create', createComment )


export default router;  