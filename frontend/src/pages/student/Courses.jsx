import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { fetchStart, fetchCoursesSuccess, fetchFailure } from '../../store/slices/courseSlice';
import { BookOpen, CheckCircle2, Flame, Search, Layers } from 'lucide-react';

const Courses = () => {
  const dispatch = useDispatch();
  const { courses, loading } = useSelector((state) => state.courses);
  const { user } = useSelector((state) => state.auth);

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCoursesData = async () => {
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
    fetchCoursesData();
  }, [dispatch]);

  const categories = ['All', 'Organic Chemistry', 'Physical Chemistry', 'Inorganic Chemistry', 'Complete Chemistry'];

  const filteredCourses = courses.filter((course) => {
    const matchesCategory = activeCategory === 'All' || course.category === activeCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const purchasedCourses = user?.purchasedCourses || [];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center">
            <BookOpen className="w-7 h-7 mr-2.5 text-cyan-400" />
            <span>Curriculum Courses</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Explore dedicated modules for Organic, Inorganic, and Physical Chemistry.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeCategory === cat
                ? 'bg-cyan-500/15 text-cyan-400 border-cyan-400/30'
                : 'bg-slate-900/40 text-slate-400 border-slate-800/70 hover:bg-slate-850'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/10 border border-slate-850 rounded-2xl">
          <Layers className="w-12 h-12 text-slate-650 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No courses found</h3>
          <p className="text-xs text-slate-500 mt-0.5">Try modifying your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => {
            const isUnlocked = purchasedCourses.includes(course._id);
            return (
              <div 
                key={course._id} 
                className="glass-card rounded-3xl overflow-hidden flex flex-col border border-slate-800 shadow-xl"
              >
                {/* Course Image */}
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                  />
                  {isUnlocked && (
                    <span className="absolute top-3 right-3 bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center shadow-lg border border-emerald-400/20">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Purchased
                    </span>
                  )}
                  {course.category === 'Complete Chemistry' && (
                    <span className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center shadow-lg">
                      <Flame className="w-3.5 h-3.5 mr-1 text-slate-950" />
                      Best Deal
                    </span>
                  )}
                </div>

                {/* Course Body */}
                <div className="p-6 flex-grow flex flex-col justify-between space-y-5">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-cyan-400 tracking-wider uppercase bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded-md inline-block">
                      {course.category}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-100 line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{course.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-850">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Fees</div>
                      <div className="text-lg font-black text-slate-200 mt-0.5">₹{course.price}</div>
                    </div>
                    <Link 
                      to={`/courses/${course._id}`}
                      className="bg-slate-900 border border-slate-800 text-cyan-400 px-5 py-2.5 rounded-xl hover:bg-slate-850 hover:text-cyan-300 transition-colors font-bold text-xs"
                    >
                      {isUnlocked ? 'Watch Lectures' : 'View Syllabus'}
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Courses;
