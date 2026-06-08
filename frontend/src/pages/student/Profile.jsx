import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { updateProfile } from '../../store/slices/authSlice';
import { 
  User as UserIcon, Calendar, BookOpen, Award, 
  CreditCard, ShieldCheck, UserCheck, CheckCircle2, History 
} from 'lucide-react';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [userClass, setUserClass] = useState(user?.class || '11');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const response = await axios.get('/api/payments/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setPaymentHistory(response.data.history);
        }
      } catch (err) {
        console.error('Failed to load transaction history:', err);
      }
    };
    if (token) fetchPaymentHistory();
  }, [token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMessage('');
    try {
      const response = await axios.put(
        '/api/auth/profile',
        { name, phone, class: userClass },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        dispatch(updateProfile(response.data.user));
        setUpdateMessage('Profile updated successfully!');
        setTimeout(() => setUpdateMessage(''), 3000);
      }
    } catch (err) {
      setUpdateMessage(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center">
          <UserIcon className="w-7 h-7 mr-2.5 text-cyan-400" />
          <span>My Profile & Stats</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Manage your personal details, monitor watch statistics, and review billing invoices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Study Statistics & Course Inventory */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Study Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center space-x-4">
              <div className="p-3 bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-450 font-bold uppercase tracking-wider">Courses Owned</div>
                <div className="text-xl font-black text-slate-200 mt-0.5">{user?.purchasedCourses?.length || 0}</div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center space-x-4">
              <div className="p-3 bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-450 font-bold uppercase tracking-wider">Watch Log Likes</div>
                <div className="text-xl font-black text-slate-200 mt-0.5">{user?.likedVideos?.length || 0}</div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center space-x-4">
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <History className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-450 font-bold uppercase tracking-wider">Study Duration</div>
                <div className="text-xl font-black text-slate-200 mt-0.5">~12.5 hours</div>
              </div>
            </div>
          </div>

          {/* Purchased courses catalog */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-200 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-cyan-400" />
              <span>Purchased Courses Syllabus</span>
            </h2>

            {paymentHistory.filter(p => p.status === 'success').length === 0 ? (
              <div className="p-8 border border-dashed border-slate-800 text-center rounded-2xl">
                <p className="text-xs text-slate-450 font-semibold">No active course subscriptions. Explore Premium courses page to enroll.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {paymentHistory
                  .filter(p => p.status === 'success')
                  .map((sub) => {
                    const course = sub.courseId;
                    if (!course) return null;
                    return (
                      <div 
                        key={sub._id} 
                        className="glass-card p-4 rounded-2xl border border-slate-800 flex space-x-4"
                      >
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-850">
                          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col justify-between py-1">
                          <div>
                            <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">{course.category}</span>
                            <h3 className="text-xs font-bold text-slate-200 mt-0.5 line-clamp-1">{course.title}</h3>
                          </div>
                          <Link 
                            to={`/courses/${course._id}`}
                            className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 inline-flex items-center"
                          >
                            <span>Open Curriculum</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Payment History Invoices */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-200 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-cyan-400" />
              <span>Billing Transaction Ledger</span>
            </h2>

            <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-450 font-bold">
                      <th className="p-4">Transaction ID</th>
                      <th className="p-4">Course Package</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {paymentHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-semibold">
                          No transactions found on this account.
                        </td>
                      </tr>
                    ) : (
                      paymentHistory.map((txn) => (
                        <tr key={txn._id} className="hover:bg-slate-900/15">
                          <td className="p-4 font-mono text-slate-400">{txn.paymentId}</td>
                          <td className="p-4 font-bold text-slate-300">{txn.courseId?.title || 'Chemistry Bundle'}</td>
                          <td className="p-4 text-slate-450 font-semibold">{formattedDate(txn.createdAt)}</td>
                          <td className="p-4 font-black text-slate-200">₹{txn.amount}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider border ${
                              txn.status === 'success' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                            }`}>
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Personal Information & Settings Form */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center border-b border-slate-850 pb-3">
              <UserCheck className="w-5 h-5 mr-2 text-cyan-400" />
              <span>Personal Information</span>
            </h3>

            {updateMessage && (
              <div className={`p-3 rounded-xl text-xs font-bold ${updateMessage.includes('success') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {updateMessage}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                  Email Address (Verified)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-900/60 border border-slate-850 text-slate-400 cursor-not-allowed focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                  Contact Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9999999999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                  Target Class
                </label>
                <select
                  value={userClass}
                  onChange={(e) => setUserClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                  <option value="Other">Other / General</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-slate-900 hover:bg-slate-850 text-cyan-400 border border-cyan-500/20 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
              >
                <span>{isUpdating ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Profile;
