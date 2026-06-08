import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

// Ensure environment variables are loaded immediately at module import time
dotenv.config({ path: envPath });

const isCloudinaryMock = 
  !process.env.CLOUDINARY_CLOUD_NAME || 
  process.env.CLOUDINARY_CLOUD_NAME.includes('mock') ||
  !process.env.CLOUDINARY_API_KEY ||
  process.env.CLOUDINARY_API_KEY.includes('mock') ||
  !process.env.CLOUDINARY_API_SECRET || 
  process.env.CLOUDINARY_API_SECRET.includes('mock');

if (!isCloudinaryMock) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary Configured successfully.');
} else {
  console.log('Cloudinary credentials not configured. Running Cloudinary in MOCK mode.');
}

export { cloudinary, isCloudinaryMock };
