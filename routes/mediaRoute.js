import { Router } from 'express';
import { upload } from '../config/cloudinary.js';
import { 
  uploadImage, 
  uploadAudio, 
  uploadVideo, 
  uploadMedia
} from '../services/mediaService.js';

const router = Router();

router.post("/upload-image", upload.single('image'), async (req, res) => {
  try {
    const result = await uploadImage(req.file);
    res.json(result);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(error.message === 'No file uploaded' ? 400 : 500)
       .json({ message: error.message });
  }
});

router.post("/upload-audio", upload.single('audio'), async (req, res) => {
  try {
    const result = await uploadAudio(req.file);
    res.json(result);
  } catch (error) {
    console.error("Error uploading audio:", error);
    res.status(error.message === 'No file uploaded' ? 400 : 500)
       .json({ message: error.message });
  }
});

router.post("/upload-video", upload.single('video'), async (req, res) => {
  try {
    const result = await uploadVideo(req.file);
    res.json(result);
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(error.message === 'No file uploaded' ? 400 : 500)
       .json({ message: error.message });
  }
});

router.post("/upload", upload.single('file'), async (req, res) => {
  try {
    const mediaType = req.body.type || 'image';
    const result = await uploadMedia(req.file, mediaType);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(error.message === 'No file uploaded' ? 400 : 500)
       .json({ message: error.message });
  }
});

export default router;