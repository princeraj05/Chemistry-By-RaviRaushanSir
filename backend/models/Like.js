import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  }
});

// Compound index to guarantee one like per user/video
likeSchema.index({ userId: 1, videoId: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);
export default Like;
