import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import VideoPlayer from '../../components/VideoPlayer';
import { Heart, BookOpen, AlertCircle, Play, ArrowLeft, HeartOff, FileText } from 'lucide-react';

const VideoWatch = () => {
  const { courseId, videoId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchVideoAndPlaylist = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        // 1. Fetch current video details (which handles purchase authorization check)
        const videoRes = await axios.get(`/api/videos/${videoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (videoRes.data.success) {
          setVideo(videoRes.data.video);
          setIsLiked(videoRes.data.liked);
          setInitialTime(videoRes.data.history?.lastWatchedTime || 0);
        }

        // 2. Fetch all videos for this course
        if (courseId !== 'free') {
          const courseRes = await axios.get(`/api/courses/${courseId}`);
          if (courseRes.data.success) {
            setPlaylist(courseRes.data.videos);
          }
        } else {
          // If accessing general/free videos, populate playlist from other free ones
          const generalRes = await axios.get('/api/videos', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (generalRes.data.success) {
            setPlaylist(generalRes.data.videos.filter(v => v.isFree));
          }
        }
      } catch (err) {
        console.error('Error fetching stream:', err);
        setErrorMsg(err.response?.data?.message || 'Access Denied: Premium content.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoAndPlaylist();
  }, [courseId, videoId, token]);

  const handleLikeToggle = async () => {
    try {
      const response = await axios.post(
        `/api/videos/${videoId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setIsLiked(response.data.liked);
      }
    } catch (err) {
      console.error('Failed to like video:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400 mx-auto"></div>
        <p className="text-xs text-slate-450 mt-3">Establishing secure connection stream...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-5">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto animate-bounce" />
        <h2 className="text-lg font-black text-slate-200">Syllabus Access Restricted</h2>
        <p className="text-xs text-slate-450 max-w-md mx-auto">{errorMsg}</p>
        <div className="pt-2">
          <Link 
            to={courseId !== 'free' ? `/courses/${courseId}` : '/courses'}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-400 to-sky-600 hover:from-cyan-350 hover:to-sky-500 text-slate-950 font-black px-6 py-3 rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Unlock Curriculum / Go Back</span>
          </Link>
        </div>
      </div>
    );
  }

  const purchasedCourses = user?.purchasedCourses || [];
  const isCourseUnlocked = courseId === 'free' || purchasedCourses.includes(courseId);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      
      {/* Back Button */}
      <Link 
        to={courseId !== 'free' ? `/courses/${courseId}` : '/dashboard'}
        className="inline-flex items-center space-x-1.5 text-xs text-slate-450 hover:text-slate-100 font-bold mb-6 transition-colors"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        <span>Return to Syllabus Curriculum</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Player & Metadata */}
        <div className="lg:col-span-2 space-y-6">
          <VideoPlayer
            videoId={video._id}
            videoUrl={video.cloudinaryVideoUrl}
            title={video.title}
            initialTime={initialTime}
            token={token}
            notesUrl={video.notesPdf}
          />

          {/* Description & Like Bar */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-cyan-400/90 tracking-wide uppercase bg-cyan-950/40 border border-cyan-800/20 px-2 py-0.5 rounded">
                  {video.category}
                </span>
                <h1 className="text-lg font-extrabold text-slate-100 mt-2">{video.title}</h1>
              </div>

              {/* Like Button */}
              <button
                onClick={handleLikeToggle}
                className={`flex items-center space-x-2 border rounded-xl px-4 py-2.5 transition-all text-xs font-bold ${
                  isLiked 
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-md' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Heart className={`w-4.5 h-4.5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{isLiked ? 'Liked Class' : 'Like Class'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-medium pt-2 border-t border-slate-850">
              {video.description}
            </p>
          </div>
        </div>

        {/* Right Column: Curriculum Video Playlist Sidebar */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-200 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-cyan-400" />
            <span>Course curriculum playlist</span>
          </h2>

          <div className="glass-panel border border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-850/80 max-h-[550px] overflow-y-auto">
            {playlist.map((item, idx) => {
              const isLocked = !item.isFree && !isCourseUnlocked;
              const isActive = item.id === videoId || item._id === videoId;

              return (
                <div
                  key={item._id || item.id}
                  className={`p-3.5 flex items-center space-x-3 transition-colors ${
                    isActive 
                      ? 'bg-cyan-500/5 text-cyan-400 font-bold' 
                      : 'hover:bg-slate-850/40'
                  }`}
                >
                  <div className="text-[10px] font-black text-slate-500 w-5 text-center">
                    {idx + 1}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="text-xs text-slate-200 truncate pr-2 font-bold">{item.title}</div>
                    <span className="text-[9px] font-semibold text-slate-450 uppercase tracking-wide block mt-0.5">
                      {item.isFree ? 'Free Class' : 'Premium Video'}
                    </span>
                  </div>

                  <div>
                    {isLocked ? (
                      <span className="text-slate-550 block">Locked</span>
                    ) : isActive ? (
                      <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider">Streaming</span>
                    ) : (
                      <button
                        onClick={() => navigate(`/courses/${courseId}/watch/${item._id || item.id}`)}
                        className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded"
                      >
                        Play
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

export default VideoWatch;
