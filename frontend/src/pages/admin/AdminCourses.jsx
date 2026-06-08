import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { fetchStart, fetchCoursesSuccess, fetchFailure } from '../../store/slices/courseSlice';
import { Plus, Edit2, Trash2, X, FolderKanban } from 'lucide-react';

const AdminCourses = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { courses, loading } = useSelector((state) => state.courses);

  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Organic Chemistry');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchCourses = async () => {
    dispatch(fetchStart());
    try {
      const response = await axios.get('/api/courses');
      if (response.data.success) {
        dispatch(fetchCoursesSuccess(response.data.courses));
      }
    } catch (err) {
      dispatch(fetchFailure(err.response?.data?.message || 'Failed to fetch courses.'));
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [dispatch]);

  const openCreateModal = () => {
    setEditingCourse(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('Organic Chemistry');
    setThumbnailFile(null);
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setDescription(course.description);
    setPrice(course.price.toString());
    setCategory(course.category);
    setThumbnailFile(null);
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('category', category);
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    try {
      let response;
      if (editingCourse) {
        response = await axios.put(`/api/courses/${editingCourse._id}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await axios.post('/api/courses', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      if (response.data.success) {
        setShowModal(false);
        fetchCourses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course and all associated lectures?')) return;

    try {
      const response = await axios.delete(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        fetchCourses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center">
            <FolderKanban className="w-7 h-7 mr-2.5 text-cyan-400" />
            <span>Manage Courses</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Configure pricing, edit core curriculum bundles, and upload class covers.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-cyan-400 to-sky-600 hover:from-cyan-300 hover:to-sky-505 text-slate-950 font-black px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/5 hover:shadow-cyan-455/20 text-xs flex items-center justify-center space-x-1"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Create Course</span>
        </button>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <div 
            key={course._id} 
            className="glass-card rounded-2xl overflow-hidden flex flex-col border border-slate-800 shadow-xl"
          >
            <div className="relative aspect-video overflow-hidden bg-slate-950">
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            </div>

            <div className="p-6 flex-grow flex flex-col justify-between space-y-5">
              <div className="space-y-2">
                <span className="text-[9px] font-black text-cyan-400 tracking-wider uppercase bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded">
                  {course.category}
                </span>
                <h3 className="text-base font-extrabold text-slate-200 line-clamp-1">{course.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{course.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-850">
                <div>
                  <div className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Fees</div>
                  <div className="text-base font-black text-slate-200 mt-0.5">₹{course.price}</div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(course)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/20 transition-all"
                    title="Edit Course"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-455 hover:text-rose-350 hover:border-rose-500/20 transition-all"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Creation / Update Modal */}
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
              {editingCourse ? 'Modify Course Attributes' : 'Create Course Attributes'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Chemistry Class 12 Boards"
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
                  placeholder="Provide syllabus chapters, target examinations..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 mb-1.5">
                    Course Fee
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1200"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-455 mb-1">
                    Thumbnail
                  </label>
                  <div className="relative border border-dashed border-slate-800 rounded-xl bg-slate-900/40 p-2.5 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setThumbnailFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-450 block truncate">
                      {thumbnailFile ? thumbnailFile.name : 'Choose Image'}
                    </span>
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
                  {submitLoading ? 'Submitting Details...' : editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCourses;
