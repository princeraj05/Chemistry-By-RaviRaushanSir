import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { adminStart, fetchStatsSuccess, adminFailure } from '../../store/slices/adminSlice';
import { 
  Users, DollarSign, BookOpen, Video as VideoIcon, 
  TrendingUp, Calendar, AlertCircle 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { stats, loading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    const fetchStats = async () => {
      dispatch(adminStart());
      try {
        const response = await axios.get('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          dispatch(fetchStatsSuccess(response.data.stats));
        }
      } catch (err) {
        dispatch(adminFailure(err.response?.data?.message || 'Failed to fetch admin stats.'));
      }
    };
    if (token) fetchStats();
  }, [token, dispatch]);

  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400 mx-auto"></div>
        <p className="text-xs text-slate-405 mt-3">Fetching platform statistics...</p>
      </div>
    );
  }

  // Chart data formatting
  const chartData = stats.salesByCategory.map(item => ({
    name: item._id,
    revenue: item.value,
    sales: item.count
  }));

  const COLORS = ['#0ea5e9', '#6366f1', '#f59e0b', '#10b981'];

  const formattedDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10">
      
      {/* Page Header */}
      <div className="pb-6 border-b border-slate-800/80">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center">
          <TrendingUp className="w-7 h-7 mr-2.5 text-cyan-400" />
          <span>Admin Control Console</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Monitor revenue growth, manage curriculums, and review student subscription logs.
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Students */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Students Enrolled</span>
            <div className="text-2xl font-black text-slate-200">{stats.totalStudents}</div>
          </div>
          <div className="p-3 bg-cyan-950/60 border border-cyan-500/25 text-cyan-450 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Revenue</span>
            <div className="text-2xl font-black text-emerald-400">₹{stats.totalRevenue}</div>
          </div>
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/25 text-emerald-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Courses */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syllabus Courses</span>
            <div className="text-2xl font-black text-slate-200">{stats.totalCourses}</div>
          </div>
          <div className="p-3 bg-indigo-950/60 border border-indigo-500/25 text-indigo-400 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Total Videos */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Videos</span>
            <div className="text-2xl font-black text-slate-200">{stats.totalVideos}</div>
          </div>
          <div className="p-3 bg-sky-950/60 border border-sky-500/25 text-sky-400 rounded-xl">
            <VideoIcon className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue by category */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Revenue Breakdown by Module</h3>
          <div className="h-64">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No purchase statistics recorded.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                  <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Subscriptions by category */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Course Enrollment Statistics</h3>
          <div className="h-64">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No enrollment statistics recorded.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="sales"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Recent Purchases Table */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-200 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-cyan-400" />
          <span>Recent Enrollments</span>
        </h3>
        
        <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 font-bold">
                  <th className="p-4">Student</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Course Enrolled</th>
                  <th className="p-4">Enrollment Time</th>
                  <th className="p-4">Fees Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {stats.recentPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-semibold">
                      No courses purchased yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentPurchases.map((purchase) => (
                    <tr key={purchase._id} className="hover:bg-slate-900/10">
                      <td className="p-4 font-bold text-slate-200">{purchase.userId?.name || 'Deleted Student'}</td>
                      <td className="p-4 text-slate-400">{purchase.userId?.email || 'N/A'}</td>
                      <td className="p-4 font-bold text-slate-350">{purchase.courseId?.title || 'Unknown Syllabus'}</td>
                      <td className="p-4 text-slate-450 font-semibold">{formattedDate(purchase.createdAt)}</td>
                      <td className="p-4 font-black text-cyan-400">₹{purchase.amount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
