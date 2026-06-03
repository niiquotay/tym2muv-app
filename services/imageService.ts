import { apiUpload } from '../utils/api';
import { getOptimizedImageUrl } from '../utils/imageOptimization';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;

/**
 * Uploads an image to Cloudinary
 * Returns the secure_url of the uploaded image (or public_id). We'll return secure_url for ease of use
 * or public_id if requested. Let's return public_id for storage compactness, but we must make sure all
 * rendering handles public IDs vs http URLs transparently via getOptimizedImageUrl.
 */
export async function uploadImageToCloudinary(file: File, onProgress?: (progress: number) => void): Promise<string> {
  // Validate file type and size before uploading
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) throw new Error('Only JPEG, PNG, and WebP images are allowed.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be smaller than 5MB.');

  if (!CLOUD_NAME) {
    console.warn('Cloudinary configuration is missing. Falling back if necessary.');
    throw new Error('Cloudinary configuration is missing');
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  // Upload preset required for unsigned uploads
  formData.append('upload_preset', UPLOAD_PRESET || 'default_preset');
  if (API_KEY) {
      formData.append('api_key', API_KEY);
  }

  onProgress?.(10);
  
  const response = await apiUpload(url, formData);

  onProgress?.(100);

  // Return the public ID to store in DB
  return response.public_id || response.secure_url;
}

export { getOptimizedImageUrl };
