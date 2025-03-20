import { cloudinary } from '../config/cloudinary.js';

/**
 * Upload image to Cloudinary
 * @param {Object} file - The uploaded file
 * @returns {Object} - The uploaded image details
 */
export const uploadImage = async (file) => {
  if (!file) {
    throw new Error('No file uploaded');
  }
  
  return {
    imageUrl: file.path,
    publicId: file.filename 
  };
};

/**
 * Upload audio to Cloudinary
 * @param {Object} file - The uploaded file
 * @returns {Object} - The uploaded audio details
 */
export const uploadAudio = async (file) => {
  if (!file) {
    throw new Error('No file uploaded');
  }
  
  return {
    url: file.path,
    publicId: file.filename 
  };
};

/**
 * Upload video to Cloudinary
 * @param {Object} file - The uploaded file
 * @returns {Object} - The uploaded video details
 */
export const uploadVideo = async (file) => {
  if (!file) {
    throw new Error('No file uploaded');
  }
  
  return {
    url: file.path,
    publicId: file.filename 
  };
};

/**
 * Generic media upload service
 * @param {Object} file - The uploaded file
 * @param {String} type - Media type (image, audio, video)
 * @returns {Object} - The uploaded media details
 */
export const uploadMedia = async (file, type = 'image') => {
  if (!file) {
    throw new Error('No file uploaded');
  }
  
  return {
    url: file.path,
    publicId: file.public_id || file.filename,
    type: type
  };
};

/**
 * Delete media from Cloudinary
 * @param {String} publicId - The public ID of the media to delete
 * @returns {Object} - Deletion result
 */
export const deleteMedia = async (publicId) => {
  if (!publicId) {
    throw new Error('No publicId provided');
  }
  
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};