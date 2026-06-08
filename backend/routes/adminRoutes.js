import express from 'express';
import { getDashboardStats, getStudents, getAllTransactions } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/students', protect, adminOnly, getStudents);
router.get('/payments', protect, adminOnly, getAllTransactions);

export default router;
