import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { fetchStart, fetchCourseSuccess, fetchFailure } from '../../store/slices/courseSlice';
import { updateProfile } from '../../store/slices/authSlice';
import { 
  Play, Lock, ShieldAlert, Award, FileText, CheckCircle2, 
  ChevronRight, AlertCircle, ShoppingBag, CreditCard, Sparkles 
} from 'lucide-react';

const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, token } = useSelector((state) => state.auth);
  const { currentCourse, loading, error } = useSelector((state) => state.courses);

  const [videos, setVideos] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockOrderData, setMockOrderData] = useState(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      dispatch(fetchStart());
      try {
        const response = await axios.get(`/api/courses/${id}`);
        if (response.data.success) {
          dispatch(fetchCourseSuccess(response.data.course));
          setVideos(response.data.videos);
        }
      } catch (err) {
        dispatch(fetchFailure(err.response?.data?.message || 'Failed to load course details.'));
      }
    };
    fetchCourseDetails();
  }, [id, dispatch]);

  if (loading || !currentCourse) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400 mx-auto"></div>
        <p className="text-xs text-slate-400 mt-3">Loading course curriculum...</p>
      </div>
    );
  }

  const purchasedCourses = user?.purchasedCourses || [];
  const isPurchased = purchasedCourses.includes(currentCourse._id);

  // Initialize Payment / Buy Course
  const handleBuyCourse = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    setCheckoutLoading(true);
    try {
      const orderRes = await axios.post(
        '/api/payments/order',
        { courseId: currentCourse._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (orderRes.data.success) {
        const { order, keyId, isMock } = orderRes.data;

        if (isMock) {
          // Trigger Mock Payment Simulation Modal
          setMockOrderData({ order, keyId });
          setShowMockModal(true);
          setCheckoutLoading(false);
          return;
        }

        // Open Real Razorpay Checkout
        const isRazorpayReady = await loadRazorpayScript();
        if (!isRazorpayReady || !window.Razorpay) {
          alert('Payment gateway could not be loaded. Please check your internet connection and try again.');
          return;
        }

        const options = {
          key: keyId,
          amount: order.amount,
          currency: order.currency,
          name: "Chemistry by Ravi Raushan Sir",
          description: currentCourse.title,
          order_id: order.id,
          handler: async function (response) {
            await verifyPayment({
              courseId: currentCourse._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              isMockPayment: false
            });
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone || ""
          },
          theme: {
            color: "#0ea5e9"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          alert(response.error?.description || 'Payment failed. Please try again.');
        });
        rzp.open();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initialize payment checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Complete Payment Verification
  const verifyPayment = async (payload) => {
    setCheckoutLoading(true);
    try {
      const verifyRes = await axios.post(
        '/api/payments/verify',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (verifyRes.data.success) {
        // Unlock Course in local Redux profile
        const updatedPurchased = purchasedCourses.includes(currentCourse._id)
          ? purchasedCourses
          : [...purchasedCourses, currentCourse._id];
        dispatch(updateProfile({ purchasedCourses: updatedPurchased }));
        setShowMockModal(false);
        alert('Payment verified! Course curriculum is unlocked.');
      }
    } catch (err) {
      alert('Payment verification failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSimulatePayment = (success) => {
    if (!success) {
      alert('Mock payment aborted.');
      setShowMockModal(false);
      return;
    }

    verifyPayment({
      courseId: currentCourse._id,
      razorpay_order_id: mockOrderData.order.id,
      razorpay_payment_id: `pay_mock_${Date.now()}`,
      razorpay_signature: 'mock_sig_123',
      isMockPayment: true
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
      
      {/* Course Hero Segment */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 flex flex-col lg:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[350px] h-[350px] rounded-full bg-cyan-600/5 blur-[120px]" />
        
        {/* Cover Thumbnail */}
        <div className="w-full lg:w-[380px] aspect-video rounded-2xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-850">
          <img src={currentCourse.thumbnail} alt={currentCourse.title} className="w-full h-full object-cover" />
        </div>

        {/* Course Details Text */}
        <div className="flex-grow space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center space-x-1.5 bg-cyan-950/60 border border-cyan-500/20 px-3 py-1 rounded-full text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentCourse.category}</span>
          </div>
          
          <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight leading-tight">
            {currentCourse.title}
          </h1>
          
          <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
            {currentCourse.description}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <div className="flex flex-col text-center sm:text-left">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Syllabus Package Fee</span>
              <span className="text-2xl font-black text-slate-200">₹{currentCourse.price}</span>
            </div>

            {isPurchased ? (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-6 py-3.5 rounded-2xl flex items-center text-xs shadow-md">
                <CheckCircle2 className="w-4.5 h-4.5 mr-2" />
                Purchased & Unlocked
              </span>
            ) : (
              <button
                onClick={handleBuyCourse}
                disabled={checkoutLoading}
                className="bg-gradient-to-r from-cyan-400 to-sky-600 hover:from-cyan-300 hover:to-sky-500 text-slate-950 font-black px-8 py-3.5 rounded-2xl transition-all duration-300 text-xs shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/25 flex items-center justify-center space-x-2"
              >
                <ShoppingBag className="w-4.5 h-4.5" />
                <span>{checkoutLoading ? 'Processing Checkout...' : 'Enroll / Buy Course'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Curriculum Syllabus List */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-100 flex items-center">
          <Award className="w-5.5 h-5.5 mr-2 text-cyan-400" />
          <span>Curriculum Lectures ({videos.length})</span>
        </h2>

        {videos.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/20 border border-slate-850 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-450 font-bold">No lectures uploaded to this syllabus yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((vid, idx) => {
              const isLocked = !vid.isFree && !isPurchased;
              return (
                <div 
                  key={vid.id}
                  className={`glass-panel border p-4 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                    isLocked 
                      ? 'border-slate-800/80 bg-slate-900/10 opacity-70' 
                      : 'border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-black text-xs text-slate-400 flex-shrink-0">
                      {idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-200 line-clamp-1">{vid.title}</h3>
                        {vid.isFree && (
                          <span className="bg-cyan-500/15 border border-cyan-400/20 text-cyan-400 font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase">
                            Free Class
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{vid.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3.5 flex-shrink-0">
                    <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">
                      {Math.ceil(vid.duration / 60)} mins
                    </span>

                    {isLocked ? (
                      <div className="p-2.5 rounded-xl bg-slate-950/60 text-slate-500 border border-slate-850" title="Locked content">
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                    ) : (
                      <Link
                        to={`/courses/${currentCourse._id}/watch/${vid.id}`}
                        className="p-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-350 text-slate-950 transition-colors shadow-md"
                        title="Watch Lecture"
                      >
                        <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mock Payment gateway simulator */}
      {showMockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-400/35 flex items-center justify-center mx-auto shadow-inner">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-100">Razorpay Payment Simulator</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                We detected the platform is running with mock API credentials. Please simulate a payment result below to unlock <span className="text-slate-300 font-bold">{currentCourse.title}</span>.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Checkout Amount:</span>
              <span className="font-black text-slate-200">₹{currentCourse.price}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSimulatePayment(false)}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Simulate Failure
              </button>
              
              <button
                onClick={() => handleSimulatePayment(true)}
                disabled={checkoutLoading}
                className="bg-gradient-to-r from-cyan-400 to-sky-600 hover:from-cyan-300 hover:to-sky-500 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-1 shadow-lg shadow-cyan-500/5"
              >
                {checkoutLoading ? 'Verifying...' : 'Simulate Success'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseDetail;
