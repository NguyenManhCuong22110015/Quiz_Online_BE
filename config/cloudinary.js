import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    if (file.mimetype.startsWith("audio/")) {
      return {
        folder: "quizz_app/audio",
        resource_type: "video", 
        format: "mp3"
      };
    }
     else if (file.mimetype.startsWith("img/")) {
      return {
        folder: "quizz_app/images",
        allowed_formats: ["jpg", "jpeg", "png", "gif"],
        transformation: [{ width: 800, height: 600, crop: "limit" }]
      };
    }
  }
});

// Create multer upload instance
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  // fileFilter: (req, file, cb) => {
  //   console.log("File received:", file.mimetype);
  //   if (!file.mimetype.startsWith("audio/")) {
  //     return cb(new Error("Only audio files are allowed"), false);
  //   }
  //   cb(null, true);
  // }

});

export { cloudinary, upload };