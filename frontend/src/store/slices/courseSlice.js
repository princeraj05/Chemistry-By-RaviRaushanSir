import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  courses: [],
  currentCourse: null,
  loading: false,
  error: null
};

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    fetchStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchCoursesSuccess: (state, action) => {
      state.loading = false;
      state.courses = action.payload;
    },
    fetchCourseSuccess: (state, action) => {
      state.loading = false;
      state.currentCourse = action.payload;
    },
    fetchFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

export const { fetchStart, fetchCoursesSuccess, fetchCourseSuccess, fetchFailure } = courseSlice.actions;
export default courseSlice.reducer;
