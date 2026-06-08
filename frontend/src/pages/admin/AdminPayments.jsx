import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { CreditCard, IndianRupee, Activity, CheckCircle, XCircle } from 'lucide-react';

const AdminPayments = () => {
  const { token } = useSelector((state) => state.auth);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/admin/payments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setTransactions(response.data.transactions);
        }
      } catch (err) {
        console.error('Failed to load transaction ledger:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchTransactions();
    }
  }, [token]);

  const formattedDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Financial analytics calculations
  const successTxns = transactions.filter(t => t.status === 'success');
  const failedTxns = transactions.filter(t => t.status === 'failed');
  const grossRevenue = successTxns.reduce((acc, curr) => acc + curr.amount, 0);
  const successRate = transactions.length > 0 
    ? ((successTxns.length / transactions.length) * 100).toFixed(0) 
    : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-800/80">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center">
          <CreditCard className="w-7 h-7 mr-2.5 text-cyan-400" />
          <span>Payments & Ledger</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Verify invoice signatures, inspect checkout fees, and monitor billing transactions.
        </p>
      </div>

      {/* Financial Analytics Summary widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Gross collection */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/25 text-emerald-450 rounded-xl">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Gross Revenue Collected</div>
            <div className="text-xl font-black text-slate-200 mt-0.5">₹{grossRevenue}</div>
          </div>
        </div>

        {/* Success count */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 bg-cyan-950/60 border border-cyan-500/25 text-cyan-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Successful Transactions</div>
            <div className="text-xl font-black text-slate-200 mt-0.5">{successTxns.length} / {transactions.length}</div>
          </div>
        </div>

        {/* Success Ratio */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 bg-indigo-950/60 border border-indigo-500/25 text-indigo-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Payment Conversion Rate</div>
            <div className="text-xl font-black text-slate-200 mt-0.5">{successRate}%</div>
          </div>
        </div>

      </div>

      {/* Transactions Table */}
      <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 font-bold">
                <th className="p-4">Razorpay ID</th>
                <th className="p-4">Student</th>
                <th className="p-4">Course Enrolled</th>
                <th className="p-4">Paid Fees</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-semibold">
                    Searching payment logs...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-semibold">
                    No checkout records logged.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn._id} className="hover:bg-slate-900/10">
                    <td className="p-4 font-mono font-bold text-slate-400">{txn.paymentId}</td>
                    <td className="p-4">
                      <div>
                        <div className="font-bold text-slate-200">{txn.userId?.name || 'Deleted Account'}</div>
                        <div className="text-[10px] text-slate-450 mt-0.5">{txn.userId?.email}</div>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-350">{txn.courseId?.title || 'Unknown Syllabus'}</td>
                    <td className="p-4 font-black text-cyan-400">₹{txn.amount}</td>
                    <td className="p-4 text-slate-455 font-semibold">{formattedDate(txn.createdAt)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center w-fit space-x-1 ${
                        txn.status === 'success' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                      }`}>
                        {txn.status === 'success' ? <CheckCircle className="w-3 h-3 mr-0.5" /> : <XCircle className="w-3 h-3 mr-0.5" />}
                        <span>{txn.status}</span>
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
  );
};

export default AdminPayments;
