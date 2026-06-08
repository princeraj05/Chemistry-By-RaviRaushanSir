import express from 'express';
import { 
  getAllVideos, 
  getVideoById, 
  createVideo, 
  updateVideo, 
  deleteVideo, 
  toggleLikeVideo, 
  updateWatchProgress 
} from '../controllers/videoController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { uploadAssets } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Get list of videos (authorized students/admin) and create video (admin only)
router.route('/')
  .get(protect, getAllVideos)
  .post(protect, adminOnly, uploadAssets, createVideo);

// Get single video details, update video details, delete video
router.route('/:id')
  .get(protect, getVideoById)
  .put(protect, adminOnly, uploadAssets, updateVideo)
  .delete(protect, adminOnly, deleteVideo);

// Toggle video like
router.post('/:id/like', protect, toggleLikeVideo);

// Save video resume playback progress
router.post('/:id/progress', protect, updateWatchProgress);

export default router;
