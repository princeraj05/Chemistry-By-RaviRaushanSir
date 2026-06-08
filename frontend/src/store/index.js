import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import courseReducer from './slices/courseSlice.js';
import videoReducer from './slices/videoSlice.js';
import adminReducer from './slices/adminSlice.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    videos: videoReducer,
    admin: adminReducer
  }
});

export default store;
