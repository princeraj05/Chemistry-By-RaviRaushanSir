import express from 'express';
import { 
  firebaseLoginUser, 
  getUserProfile, 
  updateUserProfile,
  sendEmailOtp,
  verifyEmailOtp
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/firebase', firebaseLoginUser);
router.post('/send-otp', sendEmailOtp);
router.post('/verify-otp', verifyEmailOtp);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

export default router;
