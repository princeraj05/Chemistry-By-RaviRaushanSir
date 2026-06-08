import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Like from '../models/Like.js';
import User from '../models/User.js';
import Video from '../models/Video.js';
import WatchHistory from '../models/WatchHistory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SEEDED_TITLES = [
  'IUPAC Nomenclature Rules & Practice',
  'Nucleophilic Substitution Reaction Mechanisms (SN1 vs SN2)',
  'Chemical Kinetics: Order of Reactions & Integrated Rate Law',
  'Thermodynamics: Entropy & Gibbs Free Energy calculations',
  'Introduction to Coordination Compounds & IUPAC naming',
  'Crystal Field Theory (CFT) in Octahedral Complexes',
  'Complete Syllabus Quick Revision Guide'
];

const seededVideoFilter = {
  $or: [
    { title: { $in: SEEDED_TITLES } },
    { cloudinaryVideoUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4' },
    { cloudinaryVideoUrl: /res\.cloudinary\.com\/demo\/video\/upload\/dog\.mp4/i },
    { notesPdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { notesPdf: /dummy\.pdf/i }
  ]
};

const cleanupSeededVideos = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chemistry_db';
  await mongoose.connect(mongoUri);

  const seededVideos = await Video.find(seededVideoFilter).select('_id title');
  const seededVideoIds = seededVideos.map(video => video._id);

  if (seededVideoIds.length === 0) {
    console.log('No seeded/dummy videos found.');
    return;
  }

  await WatchHistory.deleteMany({ videoId: { $in: seededVideoIds } });
  await Like.deleteMany({ videoId: { $in: seededVideoIds } });
  await User.updateMany(
    { likedVideos: { $in: seededVideoIds } },
    { $pull: { likedVideos: { $in: seededVideoIds } } }
  );
  const deleteResult = await Video.deleteMany({ _id: { $in: seededVideoIds } });

  console.log(`Deleted ${deleteResult.deletedCount} seeded/dummy video(s):`);
  seededVideos.forEach(video => console.log(`- ${video.title} (${video._id})`));
};

cleanupSeededVideos()
  .catch(error => {
    console.error('Failed to clean seeded/dummy videos:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
