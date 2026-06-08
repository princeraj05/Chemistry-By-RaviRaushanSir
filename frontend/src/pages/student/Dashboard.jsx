import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { fetchStart, fetchCoursesSuccess, fetchFailure } from '../../store/slices/courseSlice';
import { 
  Play, BookOpen, Video as VideoIcon, CheckCircle2, 
  ArrowRight, Flame, Clock, Award 
} from 'lucide-react';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { courses, loading } = useSelector((state) => state.courses);

  const [videos, setVideos] = useState([]);
  const [freeVideos, setFreeVideos] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      dispatch(fetchStart());
      try {
        // 1. Fetch courses
        const courseRes = await axios.get('/api/courses');
        if (courseRes.data.success) {
          dispatch(fetchCoursesSuccess(courseRes.data.courses));
        }

        // 2. Fetch videos
        const videoRes = await axios.get('/api/videos', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (videoRes.data.success) {
          const allVideos = videoRes.data.videos;
          setVideos(allVideos);

          // Free videos
          setFreeVideos(allVideos.filter(v => v.isFree).slice(0, 4));

          // Recently added videos
          const sorted = [...allVideos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setRecentVideos(sorted.slice(0, 4));
        }

      } catch (err) {
        dispatch(fetchFailure(err.message));
      }
    };

    fetchDashboardData();
  }, [token, dispatch]);

  const purchasedCourseIds = user?.purchasedCourses || [];
  const continueWatchingVideos = [];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10">
      
      {/* 1. Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-slate-800 p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[80px]" />
        
        <div className="space-y-3 relative z-10 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 bg-cyan-950/60 border border-cyan-500/20 px-3 py-1 rounded-full text-xs text-cyan-400 font-semibold">
            <Flame className="w-3.5 h-3.5 animate-bounce text-orange-400" />
            <span>Class {user?.class || '11/12'} Prep Hub</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">{user?.name}</span>!
          </h1>
          <p className="text-sm text-slate-350 max-w-xl font-medium">
            "Chemistry is not just a study of elements, but a study of transformations." Learn Organic, Inorganic, and Physical concepts with Ravi Raushan Sir.
          </p>
        </div>

        <div className="mt-6 md:mt-0 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex space-x-6 relative z-10 text-center md:text-left">
          <div>
            <div className="text-2xl font-black text-cyan-400">{purchasedCourseIds.length}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Courses Unlocked</div>
          </div>
          <div className="border-l border-slate-800" />
          <div>
            <div className="text-2xl font-black text-indigo-400">{videos.length}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Lectures</div>
          </div>
        </div>
      </div>

      {/* 2. Continue Watching section (visible if student has unlocked content) */}
      {continueWatchingVideos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-cyan-400" />
            <span>Continue Watching</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {continueWatchingVideos.map((video) => (
              <div 
                key={video._id} 
                className="glass-card rounded-2xl overflow-hidden flex flex-col sm:flex-row border border-slate-800 hover:border-slate-700/80 transition-all"
              >
                <div className="relative sm:w-48 aspect-video sm:aspect-auto overflow-hidden bg-slate-950 flex-shrink-0">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Link 
                    to={`/courses/${video.courseId?._id}/watch/${video._id}`}
                    className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </Link>
                </div>

                <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded-full uppercase">
                      {video.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-200 mt-1 line-clamp-1">{video.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{video.courseId?.title}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>{video.progressPercent}% Watched</span>
                      <span>{video.timeLeft}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-400 rounded-full" 
                        style={{ width: `${video.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Premium Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-cyan-400" />
            <span>Premium Course Bundles</span>
          </h2>
          <Link to="/courses" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center">
            <span>View All</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.slice(0, 4).map((course) => {
            const isPurchased = purchasedCourseIds.includes(course._id);
            return (
              <div 
                key={course._id} 
                className="glass-card rounded-2xl overflow-hidden flex flex-col border border-slate-800 shadow-lg"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover" 
                  />
                  {isPurchased && (
                    <span className="absolute top-3 right-3 bg-emerald-500 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-full flex items-center shadow-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Purchased
                    </span>
                  )}
                </div>
                
                <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-cyan-400/90 tracking-wide uppercase">
                      {course.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100 line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{course.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-850">
                    <span className="text-sm font-black text-slate-200">
                      ₹{course.price}
                    </span>
                    <Link 
                      to={`/courses/${course._id}`}
                      className="text-xs font-bold bg-slate-900 border border-slate-800 text-cyan-400 px-3.5 py-1.5 rounded-xl hover:bg-slate-850 hover:text-cyan-300 transition-colors"
                    >
                      {isPurchased ? 'View Curriculum' : 'Buy Now'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Free Lecture Videos */}
      {freeVideos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center">
            <VideoIcon className="w-5 h-5 mr-2 text-cyan-400" />
            <span>Free Lectures</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {freeVideos.map((video) => (
              <Link
                key={video._id}
                to={`/courses/${video.courseId?._id || 'free'}/watch/${video._id}`}
                className="glass-card rounded-2xl overflow-hidden flex flex-col border border-slate-800 hover:border-slate-700/80 transition-all"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-slate-900/90 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-2.5 right-2.5 bg-cyan-400 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-md">
                    FREE CLASS
                  </span>
                </div>
                <div className="p-3.5 space-y-1">
                  <h3 className="text-xs font-bold text-slate-200 line-clamp-1">{video.title}</h3>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{video.courseId?.title || 'General Chemistry'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 5. Recently Added Videos */}
      {recentVideos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center">
            <Award className="w-5 h-5 mr-2 text-cyan-400" />
            <span>Recently Added Lectures</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentVideos.map((video) => {
              const isLocked = !video.isFree && !purchasedCourseIds.includes(video.courseId?._id);
              return (
                <Link
                  key={video._id}
                  to={isLocked ? `/courses/${video.courseId?._id}` : `/courses/${video.courseId?._id}/watch/${video._id}`}
                  className="glass-card rounded-2xl overflow-hidden flex flex-col border border-slate-800 hover:border-slate-700/80 transition-all"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-950">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    {isLocked ? (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest bg-amber-950/80 border border-amber-500/20 px-3 py-1 rounded-full shadow-lg">
                          Premium Lecture
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-slate-950/15 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-slate-900/90 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h3 className="text-xs font-bold text-slate-200 line-clamp-1">{video.title}</h3>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{video.courseId?.title || 'General Chemistry'}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
