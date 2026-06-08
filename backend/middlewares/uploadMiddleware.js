import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary, isCloudinaryMock } from '../config/cloudinary.js';

let storage;

if (!isCloudinaryMock) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      let folder = 'chemistry_coaching/others';
      let resource_type = 'auto';

      if (file.mimetype.startsWith('video/')) {
        folder = 'chemistry_coaching/videos';
        resource_type = 'video';
      } else if (file.mimetype.startsWith('image/')) {
        folder = 'chemistry_coaching/thumbnails';
        resource_type = 'image';
      } else if (file.mimetype === 'application/pdf') {
        folder = 'chemistry_coaching/notes';
        resource_type = 'raw';
      }

      // Extract original name without extension
      const originalNameCleaned = file.originalname
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_]/g, "_");

      const uploadParams = {
        folder: folder,
        resource_type: resource_type,
        public_id: `${originalNameCleaned}_${Date.now()}`
      };

      if (file.mimetype === 'application/pdf') {
        uploadParams.format = 'pdf'; // Force pdf extension for documents
      }

      return uploadParams;
    }
  });
} else {
  // In mock mode, keep files in memory
  storage = multer.memoryStorage();
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max file size
  }
});

// Configure fields middleware for uploading course/video assets
export const uploadAssets = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'notesPdf', maxCount: 1 }
]);

export default upload;
