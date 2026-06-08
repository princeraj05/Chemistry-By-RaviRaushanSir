import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentVideo: null,
  watchHistory: [],
  freeVideos: [],
  loading: false,
  error: null
};

const videoSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    videoStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    videoSuccess: (state, action) => {
      state.loading = false;
      state.currentVideo = action.payload;
    },
    videoFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateLikeState: (state, action) => {
      if (state.currentVideo && state.currentVideo.video._id === action.payload.videoId) {
        state.currentVideo.liked = action.payload.liked;
      }
    },
    setWatchHistory: (state, action) => {
      state.watchHistory = action.payload;
    },
    setFreeVideos: (state, action) => {
      state.freeVideos = action.payload;
    }
  }
});

export const { 
  videoStart, 
  videoSuccess, 
  videoFailure, 
  updateLikeState, 
  setWatchHistory, 
  setFreeVideos 
} = videoSlice.actions;

export default videoSlice.reducer;
