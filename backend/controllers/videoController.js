import Video from '../models/Video.js';
import Course from '../models/Course.js';
import Like from '../models/Like.js';
import WatchHistory from '../models/WatchHistory.js';
import User from '../models/User.js';
import { cloudinary, isCloudinaryMock } from '../config/cloudinary.js';

/**
 * @desc    Get all videos (Admin views all, Students view only what is relevant)
 * @route   GET /api/videos
 * @access  Private (Admin or Registered Student)
 */
export const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find({}).populate('courseId', 'title');
    return res.status(200).json({ success: true, videos });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc    Get details of a single video, verifying course access
 * @route   GET /api/videos/:id
 * @access  Private (Student or Admin)
 */
export const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    // If video is premium and user is a student, verify course purchase
    if (!video.isFree && req.user.role !== 'admin') {
      const isPurchased = req.user.purchasedCourses.includes(video.courseId.toString());
      if (!isPurchased) {
        return res.status(403).json({ 
          success: false, 
          message: 'Premium course content. Please purchase course to access this video.',
          courseId: video.courseId
        });
      }
    }

    // Fetch user's watch history for this video (if any)
    const history = await WatchHistory.findOne({ userId: req.user._id, videoId: video._id });
    
    // Check if liked
    const liked = await Like.findOne({ userId: req.user._id, videoId: video._id });

    return res.status(200).json({
      success: true,
      video,
      history: history ? { lastWatchedTime: history.lastWatchedTime, completed: history.completed } : null,
      liked: !!liked
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc    Upload & Create video details
 * @route   POST /api/videos
 * @access  Private (Admin)
 */
export const createVideo = async (req, res) => {
  const { title, description, courseId, category, isFree, duration } = req.body;

  if (!title || !description || !courseId || !category) {
    return res.status(400).json({ success: false, message: 'Required fields are missing.' });
  }

  try {
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Associated course not found.' });
    }

    if (isCloudinaryMock) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary is not configured. Configure Cloudinary before uploading real lectures.'
      });
    }

    if (!req.files?.video?.[0]) {
      return res.status(400).json({ success: false, message: 'Please upload a real lecture video file.' });
    }

    if (!req.files?.thumbnail?.[0]) {
      return res.status(400).json({ success: false, message: 'Please upload a real lecture thumbnail.' });
    }

    const videoUrl = req.files.video[0].path;
    const thumbnailUrl = req.files.thumbnail[0].path;
    const pdfUrl = req.files.notesPdf?.[0]?.path || '';

    let finalDuration = duration ? Number(duration) : 0;

    try {
      const publicId = req.files.video[0].filename;
      const resourceInfo = await cloudinary.api.resource(publicId, { resource_type: 'video' });
      if (resourceInfo && resourceInfo.duration) {
        finalDuration = Math.ceil(resourceInfo.duration);
        console.log(`[Cloudinary Auto-Duration] Resolved duration: ${finalDuration}s for publicId: ${publicId}`);
      }
    } catch (err) {
      console.error('[Cloudinary Auto-Duration] Error retrieving video metadata:', err.message);
    }

    if (!Number.isFinite(finalDuration) || finalDuration <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid lecture duration.' });
    }

    const video = await Video.create({
      title,
      description,
      courseId,
      category,
      cloudinaryVideoUrl: videoUrl,
      thumbnail: thumbnailUrl,
      notesPdf: pdfUrl,
      isFree: isFree === 'true' || isFree === true,
      duration: finalDuration
    });

    return res.status(201).json({ success: true, video });
  } catch (error) {
    console.error('Error creating video:', error);
    return res.status(500).json({ success: false, message: 'Error uploading video.', error: error.message });
  }
};

/**
 * @desc    Update video details
 * @route   PUT /api/videos/:id
 * @access  Private (Admin)
 */
export const updateVideo = async (req, res) => {
  const { title, description, isFree, duration, category, courseId } = req.body;

  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    if (title) video.title = title;
    if (description) video.description = description;
    if (category) video.category = category;
    if (courseId) video.courseId = courseId;
    let finalDuration = duration ? Number(duration) : video.duration;

    if (!isCloudinaryMock && req.files) {
      if (req.files.video) {
        video.cloudinaryVideoUrl = req.files.video[0].path;
        if (!duration) {
          try {
            const publicId = req.files.video[0].filename;
            const resourceInfo = await cloudinary.api.resource(publicId, { resource_type: 'video' });
            if (resourceInfo && resourceInfo.duration) {
              finalDuration = Math.ceil(resourceInfo.duration);
              console.log(`[Cloudinary Auto-Duration Update] Resolved duration: ${finalDuration}s for publicId: ${publicId}`);
            }
          } catch (err) {
            console.error('[Cloudinary Auto-Duration Update] Error retrieving video metadata:', err.message);
          }
        }
      }
      if (req.files.thumbnail) video.thumbnail = req.files.thumbnail[0].path;
      if (req.files.notesPdf) video.notesPdf = req.files.notesPdf[0].path;
    }

    video.duration = finalDuration;
    if (isFree !== undefined) video.isFree = isFree === 'true' || isFree === true;

    const updatedVideo = await video.save();
    return res.status(200).json({ success: true, video: updatedVideo });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating video.', error: error.message });
  }
};

/**
 * @desc    Delete video
 * @route   DELETE /api/videos/:id
 * @access  Private (Admin)
 */
export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    // Clear WatchHistory, Likes, and Video records
    await WatchHistory.deleteMany({ videoId: video._id });
    await Like.deleteMany({ videoId: video._id });
    await Video.deleteOne({ _id: video._id });

    return res.status(200).json({ success: true, message: 'Video record and associated watch logs deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting video.', error: error.message });
  }
};

/**
 * @desc    Toggle video like status
 * @route   POST /api/videos/:id/like
 * @access  Private
 */
export const toggleLikeVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user._id;

    const existingLike = await Like.findOne({ userId, videoId });

    if (existingLike) {
      // Unlike
      await Like.deleteOne({ userId, videoId });
      await User.findByIdAndUpdate(userId, { $pull: { likedVideos: videoId } });
      return res.status(200).json({ success: true, liked: false });
    } else {
      // Like
      await Like.create({ userId, videoId });
      await User.findByIdAndUpdate(userId, { $addToSet: { likedVideos: videoId } });
      return res.status(200).json({ success: true, liked: true });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error liking video.', error: error.message });
  }
};

/**
 * @desc    Update last watched time and completion status
 * @route   POST /api/videos/:id/progress
 * @access  Private
 */
export const updateWatchProgress = async (req, res) => {
  const { lastWatchedTime, completed } = req.body;

  try {
    const videoId = req.params.id;
    const userId = req.user._id;

    let progress = await WatchHistory.findOne({ userId, videoId });

    if (progress) {
      progress.lastWatchedTime = Number(lastWatchedTime) || 0;
      progress.completed = completed === true || completed === 'true';
      progress.updatedAt = Date.now();
      await progress.save();
    } else {
      progress = await WatchHistory.create({
        userId,
        videoId,
        lastWatchedTime: Number(lastWatchedTime) || 0,
        completed: completed === true || completed === 'true'
      });
    }

    return res.status(200).json({ success: true, progress });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating progress.', error: error.message });
  }
};
