import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  category: {
    type: String,
    enum: ['Organic Chemistry', 'Physical Chemistry', 'Inorganic Chemistry', 'Complete Chemistry'],
    required: true
  },
  cloudinaryVideoUrl: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  notesPdf: {
    type: String,
    default: ''
  },
  isFree: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Video = mongoose.model('Video', videoSchema);
export default Video;
