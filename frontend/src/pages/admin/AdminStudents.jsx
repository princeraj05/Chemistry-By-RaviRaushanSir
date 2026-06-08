import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Users, Search, GraduationCap, Calendar, Mail, Phone } from 'lucide-react';

const AdminStudents = () => {
  const { token } = useSelector((state) => state.auth);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/students?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (err) {
      console.error('Failed to load student profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStudents();
    }
  }, [token, search]);

  const formattedDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const displayStudentEmail = (student) => {
    const uidEmail = student.firebaseUid?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
    return uidEmail || student.email || 'Email unavailable';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center">
            <Users className="w-7 h-7 mr-2.5 text-cyan-400" />
            <span>Students Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Monitor registered students, inspect target classes, and search user profiles.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 font-bold">
                <th className="p-4">Student Details</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Target Class</th>
                <th className="p-4">Purchased Courses</th>
                <th className="p-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-semibold">
                    Searching students ledger...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-semibold">
                    No students matching search criteria found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-900/10">
                    <td className="p-4">
                      <div>
                        <div className="font-extrabold text-slate-200 text-sm">{student.name}</div>
                        <div className="text-[10px] text-slate-450 mt-0.5 font-mono">{displayStudentEmail(student)}</div>
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center text-slate-350">
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-cyan-400/80" />
                        <span>{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center text-slate-400">
                          <Phone className="w-3.5 h-3.5 mr-1.5 text-cyan-400/85" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        Class {student.class}
                      </span>
                    </td>
                    <td className="p-4">
                      {student.purchasedCourses.length === 0 ? (
                        <span className="text-slate-500 font-medium italic">No courses owned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {student.purchasedCourses.map((c) => (
                            <span 
                              key={c._id} 
                              className="bg-indigo-950/60 text-indigo-350 border border-indigo-500/25 px-2 py-0.5 rounded text-[9px] font-bold"
                              title={c.title}
                            >
                              {c.category === 'Complete Chemistry' ? 'Complete' : c.category.split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-450 font-semibold flex-shrink-0">
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        <span>{formattedDate(student.createdAt)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminStudents;
