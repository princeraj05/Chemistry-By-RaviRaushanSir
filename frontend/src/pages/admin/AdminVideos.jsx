import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { fetchStart, fetchCoursesSuccess, fetchFailure } from '../../store/slices/courseSlice';
import { Plus, Edit2, Trash2, X, Film, Upload, FileText, Check, AlertCircle } from 'lucide-react';

const AdminVideos = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { courses } = useSelector((state) => state.courses);

  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [category, setCategory] = useState('Organic Chemistry');
  const [isFree, setIsFree] = useState(false);
  const [duration, setDuration] = useState('');
  
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [notesPdfFile, setNotesPdfFile] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const response = await axios.get('/api/videos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setVideos(response.data.videos);
      }
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const fetchCourses = async () => {
    dispatch(fetchStart());
    try {
      const response = await axios.get('/api/courses');
      if (response.data.success) {
        dispatch(fetchCoursesSuccess(response.data.courses));
        if (response.data.courses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(response.data.courses[0]._id);
        }
      }
    } catch (err) {
      dispatch(fetchFailure(err.response?.data?.message || 'Failed to fetch courses.'));
    }
  };

  useEffect(() => {
    if (token) {
      fetchVideos();
      fetchCourses();
    }
  }, [token, dispatch]);

  const openCreateModal = () => {
    setEditingVideo(null);
    setTitle('');
    setDescription('');
    if (courses.length > 0) setSelectedCourseId(courses[0]._id);
    setCategory('Organic Chemistry');
    setIsFree(false);
    setDuration('');
    setVideoFile(null);
    setThumbnailFile(null);
    setNotesPdfFile(null);
    setShowModal(true);
  };

  const openEditModal = (video) => {
    setEditingVideo(video);
    setTitle(video.title);
    setDescription(video.description);
    setSelectedCourseId(video.courseId?._id || '');
    setCategory(video.category);
    setIsFree(video.isFree);
    setDuration(video.duration ? video.duration.toString() : '');
    setVideoFile(null);
    setThumbnailFile(null);
    setNotesPdfFile(null);
    setShowModal(true);
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFile(file);
    
    // Parse video duration automatically on the client side
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElement.src);
      const parsedDuration = Math.round(videoElement.duration);
      if (parsedDuration) {
        setDuration(parsedDuration.toString());
        console.log(`[Video Metadata] Automatically parsed video duration: ${parsedDuration} seconds.`);
      }
    };
    videoElement.src = window.URL.createObjectURL(file);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!editingVideo && !videoFile) {
      alert('Please choose a real lecture video before uploading.');
      return;
    }

    if (!editingVideo && !thumbnailFile) {
      alert('Please choose a real lecture thumbnail before uploading.');
      return;
    }

    setSubmitLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('courseId', selectedCourseId);
    formData.append('category', category);
    formData.append('isFree', isFree);
    formData.append('duration', duration || 0);

    if (videoFile) formData.append('video', videoFile);
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
    if (notesPdfFile) formData.append('notesPdf', notesPdfFile);

    try {
      let response;
      if (editingVideo) {
        response = await axios.put(`/api/videos/${editingVideo._id}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await axios.post('/api/videos', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      if (response.data.success) {
        setShowModal(false);
        fetchVideos();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this lecture?')) return;

    try {
      const response = await axios.delete(`/api/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        fetchVideos();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete video.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center">
            <Film className="w-7 h-7 mr-2.5 text-cyan-400" />
            <span>Manage Lectures</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Upload chemistry videos to Cloudinary, assign categories, and attach PDF study notes.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          disabled={courses.length === 0}
          className="bg-gradient-to-r from-cyan-400 to-sky-600 hover:from-cyan-300 hover:to-sky-505 text-slate-950 font-black px-5 py-2.5 rounded-xl transition-all shadow-lg text-xs flex items-center justify-center space-x-1 disabled:opacity-50"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Upload Lecture</span>
        </button>
      </div>

      {courses.length === 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-xl flex items-center">
          <AlertCircle className="w-4.5 h-4.5 mr-2" />
          You need to create at least one course bundle before uploading lectures.
        </div>
      )}

      {/* Videos Ledger */}
      <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 font-bold">
                <th className="p-4">Cover</th>
                <th className="p-4">Lecture Title</th>
                <th className="p-4">Course Package</th>
                <th className="p-4">Category</th>
                <th className="p-4">Type</th>
                <th className="p-4">Duration</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loadingVideos ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-semibold">
                    Loading video directory...
                  </td>
                </tr>
              ) : videos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-semibold">
                    No lectures uploaded yet.
                  </td>
                </tr>
              ) : (
                videos.map((vid) => (
                  <tr key={vid._id} className="hover:bg-slate-900/10">
                    <td className="p-4">
                      <div className="w-16 h-10 rounded overflow-hidden bg-slate-950 border border-slate-850">
                        <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-200">
                      <div>
                        <div>{vid.title}</div>
                        {vid.notesPdf && (
                          <span className="inline-flex items-center text-[9px] text-cyan-400/80 font-bold mt-0.5">
                            <FileText className="w-3 h-3 mr-0.5" />
                            PDF Notes Attached
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-350">{vid.courseId?.title || 'Unknown Syllabus'}</td>
                    <td className="p-4 text-slate-400">{vid.category}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        vid.isFree 
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {vid.isFree ? 'Free' : 'Premium'}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-400">{Math.ceil(vid.duration / 60)} mins</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(vid)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(vid._id)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-350 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-xl text-slate-400 hover:text-slate-105 hover:bg-slate-800"
            >
              <X className="w-5.5 h-5.5" />
            </button>

            <h2 className="text-lg font-black text-slate-200 mb-6">
              {editingVideo ? 'Modify Lecture Attributes' : 'Upload Chemistry Lecture'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 mb-1.5">
                  Lecture Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Alcohols and Ethers"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 mb-1.5">
                  Description / Study Plan
                </label>
                <textarea
                  required
                  placeholder="Summarize what equations, laws, or mechanisms are explained..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 mb-1.5">
                    Course Syllabus
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 mb-1.5">
                    Category Tag
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Organic Chemistry">Organic Chemistry</option>
                    <option value="Physical Chemistry">Physical Chemistry</option>
                    <option value="Inorganic Chemistry">Inorganic Chemistry</option>
                    <option value="Complete Chemistry">Complete Chemistry</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center min-h-[44px]">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer bg-slate-900 border-slate-800"
                  />
                  <span className="text-[11px] font-bold text-slate-350 uppercase tracking-wide">
                    Mark as Free Class
                  </span>
                </label>
              </div>

              {/* Uploads Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Video */}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-455 mb-1">Video File</label>
                  <div className="relative border border-dashed border-slate-800 rounded-xl bg-slate-900/40 p-2.5 text-center">
                    <input type="file" accept="video/*" required={!editingVideo} onChange={handleVideoFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <span className="text-[10px] text-slate-450 block truncate">{videoFile ? videoFile.name : 'Choose Video'}</span>
                  </div>
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-455 mb-1">Thumbnail</label>
                  <div className="relative border border-dashed border-slate-800 rounded-xl bg-slate-900/40 p-2.5 text-center">
                    <input type="file" accept="image/*" required={!editingVideo} onChange={(e) => setThumbnailFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <span className="text-[10px] text-slate-450 block truncate">{thumbnailFile ? thumbnailFile.name : 'Choose Image'}</span>
                  </div>
                </div>

                {/* PDF Notes */}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-455 mb-1">PDF Notes</label>
                  <div className="relative border border-dashed border-slate-800 rounded-xl bg-slate-900/40 p-2.5 text-center">
                    <input type="file" accept="application/pdf" onChange={(e) => setNotesPdfFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <span className="text-[10px] text-slate-455 block truncate">{notesPdfFile ? notesPdfFile.name : 'Choose PDF'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-gradient-to-r from-cyan-400 to-sky-600 hover:from-cyan-300 hover:to-sky-505 text-slate-950 font-black px-6 py-2.5 rounded-xl transition-all"
                >
                  {submitLoading ? 'Uploading Assets...' : editingVideo ? 'Save Changes' : 'Upload Video'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminVideos;
