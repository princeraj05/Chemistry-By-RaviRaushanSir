import express from 'express';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } from '../controllers/courseController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { uploadAssets } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Publicly fetch courses. Creation is admin-only and parses thumbnail.
router.route('/')
  .get(getCourses)
  .post(protect, adminOnly, uploadAssets, createCourse);

// Single course details, updating, and deleting.
router.route('/:id')
  .get(getCourseById)
  .put(protect, adminOnly, uploadAssets, updateCourse)
  .delete(protect, adminOnly, deleteCourse);

export default router;
