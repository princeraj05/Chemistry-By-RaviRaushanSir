import mongoose from 'mongoose';

const watchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  lastWatchedTime: {
    type: Number,
    default: 0 // in seconds
  },
  completed: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

watchHistorySchema.index({ userId: 1, videoId: 1 }, { unique: true });

const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);
export default WatchHistory;
