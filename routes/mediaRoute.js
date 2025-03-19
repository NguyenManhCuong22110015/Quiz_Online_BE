import { Router } from 'express';
import { upload, cloudinary } from '../config/cloudinary.js';
const router = Router();

router.post("/upload-image", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({ 
      imageUrl: req.file.path,
      publicId: req.file.filename 
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: error.message });
  }
});


router.post("/upload-audio", upload.single('audio'), async (req, res) => {
  try {
    console.log("Received file:", req.file);
    console.log("Received body:", req.body);
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({ 
      imageUrl: req.file.path,
      publicId: req.file.filename 
    });
  } catch (error) {
    console.error("Error uploading audio:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/upload-video", upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({ 
      imageUrl: req.file.path,
      publicId: req.file.filename 
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: error.message });
  }
});


router.post("/upload", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const mediaType = req.body.type || 'image';
    
    return res.status(200).json({
      url: req.file.path,
      publicId: req.file.public_id,
      type: mediaType
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return res.status(500).json({ message: error.message });
  }
});



export default router;