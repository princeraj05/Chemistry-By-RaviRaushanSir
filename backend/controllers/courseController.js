import Course from '../models/Course.js';
import Video from '../models/Video.js';
import { isCloudinaryMock } from '../config/cloudinary.js';

// Predefined unsplash placeholder thumbnails for chemistry categories
const PLACEHOLDERS = {
  'Organic Chemistry': 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&q=80&w=800',
  'Physical Chemistry': 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&q=80&w=800',
  'Inorganic Chemistry': 'https://images.unsplash.com/photo-1617155093730-a8bf47be792d?auto=format&fit=crop&q=80&w=800',
  'Complete Chemistry': 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&q=80&w=800'
};

/**
 * @desc    Get all courses
 * @route   GET /api/courses
 * @access  Public
 */
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc    Get single course with its list of videos
 * @route   GET /api/courses/:id
 * @access  Public (Curriculum is public, but only free videos are playable without course purchase)
 */
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Find all videos associated with this course
    const videos = await Video.find({ courseId: course._id }).sort({ createdAt: 1 });

    return res.status(200).json({ 
      success: true, 
      course, 
      videos: videos.map(vid => ({
        id: vid._id,
        title: vid.title,
        description: vid.description,
        category: vid.category,
        thumbnail: vid.thumbnail,
        isFree: vid.isFree,
        duration: vid.duration,
        // Cloudinary URL is returned, but frontend will restrict playing if premium and student hasn't purchased
        cloudinaryVideoUrl: vid.cloudinaryVideoUrl,
        notesPdf: vid.notesPdf,
        createdAt: vid.createdAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc    Create a course
 * @route   POST /api/courses
 * @access  Private (Admin)
 */
export const createCourse = async (req, res) => {
  const { title, description, price, category } = req.body;

  if (!title || !description || !price || !category) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    // Check thumbnail upload
    let thumbnail = PLACEHOLDERS[category] || PLACEHOLDERS['Complete Chemistry'];
    if (!isCloudinaryMock && req.files && req.files.thumbnail) {
      thumbnail = req.files.thumbnail[0].path;
    }

    const course = await Course.create({
      title,
      description,
      price: Number(price),
      category,
      thumbnail
    });

    return res.status(201).json({ success: true, course });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating course.', error: error.message });
  }
};

/**
 * @desc    Update a course
 * @route   PUT /api/courses/:id
 * @access  Private (Admin)
 */
export const updateCourse = async (req, res) => {
  const { title, description, price, category } = req.body;

  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (title) course.title = title;
    if (description) course.description = description;
    if (price) course.price = Number(price);
    if (category) course.category = category;

    if (!isCloudinaryMock && req.files && req.files.thumbnail) {
      course.thumbnail = req.files.thumbnail[0].path;
    }

    const updatedCourse = await course.save();
    return res.status(200).json({ success: true, course: updatedCourse });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating course.', error: error.message });
  }
};

/**
 * @desc    Delete a course
 * @route   DELETE /api/courses/:id
 * @access  Private (Admin)
 */
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Remove associated videos
    await Video.deleteMany({ courseId: course._id });
    await Course.deleteOne({ _id: course._id });

    return res.status(200).json({ success: true, message: 'Course and its associated videos deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting course.', error: error.message });
  }
};
