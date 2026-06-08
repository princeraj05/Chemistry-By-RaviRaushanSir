import express from 'express';
import { createOrder, verifyPayment, getPaymentHistory } from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/history', protect, getPaymentHistory);

export default router;
