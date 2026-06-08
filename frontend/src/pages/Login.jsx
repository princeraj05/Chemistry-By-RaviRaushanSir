import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  authStart, 
  authSuccess, 
  authFailure 
} from '../store/slices/authSlice';
import ThemeToggle from '../components/ThemeToggle';
import { 
  auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  RecaptchaVerifier,
  signInWithPhoneNumber
} from '../firebase';
import { FlaskConical, Sparkles, LogIn, Phone, ShieldCheck, Mail, ChevronRight, Lock, User, KeyRound } from 'lucide-react';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [selectedClass, setSelectedClass] = useState('11');
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'

  // Email OTP States
  const [email, setEmail] = useState('');
  
  // Local storage email history for login quick selection
  const [emailHistory, setEmailHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('login_history');
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const saveEmailToHistory = (emailToSave) => {
    if (!emailToSave || emailToSave.includes('phone_') || emailToSave.includes('firebase_')) return;
    try {
      const trimmedEmail = emailToSave.trim().toLowerCase();
      const stored = localStorage.getItem('login_history');
      let history = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(history)) history = [];
      
      history = history.filter(e => e.toLowerCase() !== trimmedEmail);
      history.unshift(trimmedEmail);
      history = history.slice(0, 5); // Remember up to last 5 accounts
      
      localStorage.setItem('login_history', JSON.stringify(history));
      setEmailHistory(history);
    } catch (err) {
      console.error('Error saving email to history:', err);
    }
  };

  const getEmailHistorySuggestions = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return emailHistory;
    }
    return emailHistory.filter(e => e.includes(trimmed) && e !== trimmed);
  };

  const emailSuggestions = getEmailHistorySuggestions();
  const [emailOtp, setEmailOtp] = useState('');
  const [showEmailOtpField, setShowEmailOtpField] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // Phone OTP States
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [showPhoneOtpField, setShowPhoneOtpField] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState('');
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneConfirmationResult, setPhoneConfirmationResult] = useState(null);

  // Send Firebase Token to Backend (for Google and Phone Auth)
  const handleFirebaseSync = async (idToken) => {
    console.log("[Firebase Auth Sync] Initiating backend POST request to /api/auth/firebase...");
    try {
      const response = await axios.post('/api/auth/firebase', {
        firebaseToken: idToken,
        class: selectedClass
      }, { timeout: 10000 });
      
      console.log("[Firebase Auth Sync] Received response:", response.data);
      if (response.data.success) {
        dispatch(authSuccess({
          user: response.data.user,
          token: response.data.token
        }));
        saveEmailToHistory(response.data.user.email);
        const targetRoute = response.data.user.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/dashboard';
        navigate(targetRoute);
      } else {
        throw new Error(response.data.message || 'Verification rejected by backend.');
      }
    } catch (err) {
      console.error("[Firebase Auth Sync] Sync Error:", err);
      let errMsg = 'Failed to synchronize session with backend.';
      if (err.code === 'ECONNABORTED') {
        errMsg = 'Network request timed out. Please check your server connection.';
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.message) {
        errMsg = err.message;
      }
      dispatch(authFailure(errMsg));
      throw new Error(errMsg);
    }
  };

  // 1. Send Email OTP (Custom Nodemailer)
  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setEmailMessage('Please enter a valid email address.');
      return;
    }
    console.log("[Email OTP Send] Initiating OTP send for email:", email);
    setIsEmailLoading(true);
    setEmailMessage('');
    dispatch(authStart());
    
    try {
      const response = await axios.post('/api/auth/send-otp', { email }, { timeout: 10000 });
      console.log("[Email OTP Send] Server response:", response.data);
      if (response.data.success) {
        setShowEmailOtpField(true);
        setEmailMessage(response.data.message);
        dispatch(authFailure(null)); // clears error and loading
      } else {
        throw new Error(response.data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error('[Email OTP Send] Error:', err);
      let errMsg = 'Failed to send OTP to email.';
      if (err.code === 'ECONNABORTED') {
        errMsg = 'Server connection timed out. Please try again.';
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.message) {
        errMsg = err.message;
      }
      setEmailMessage(errMsg);
      dispatch(authFailure(errMsg));
    } finally {
      setIsEmailLoading(false);
    }
  };

  // 2. Verify Email OTP (Custom Nodemailer)
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (!emailOtp) {
      setEmailMessage('Please enter the verification code.');
      return;
    }
    console.log("[Email OTP Verify] Verifying code:", emailOtp);
    setIsVerifying(true);
    setEmailMessage('');
    dispatch(authStart());
    
    try {
      const response = await axios.post('/api/auth/verify-otp', {
        email,
        otp: emailOtp,
        className: selectedClass
      }, { timeout: 10000 });
      
      console.log("[Email OTP Verify] Server response:", response.data);
      if (response.data.success) {
        dispatch(authSuccess({
          user: response.data.user,
          token: response.data.token
        }));
        saveEmailToHistory(response.data.user.email);
        const targetRoute = response.data.user.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/dashboard';
        navigate(targetRoute);
      } else {
        throw new Error(response.data.message || 'OTP verification failed.');
      }
    } catch (err) {
      console.error('[Email OTP Verify] Error:', err);
      let errMsg = 'Verification failed. Try code "123456" or check server console.';
      if (err.code === 'ECONNABORTED') {
        errMsg = 'Server connection timed out. Please try again.';
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.message) {
        errMsg = err.message;
      }
      setEmailMessage(errMsg);
      dispatch(authFailure(errMsg));
    } finally {
      setIsVerifying(false);
    }
  };

  // Initialize invisible reCAPTCHA
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      console.log("[reCAPTCHA] Creating stable RecaptchaVerifier instance...");
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log("[reCAPTCHA] reCAPTCHA challenge solved successfully.");
        },
        'expired-callback': () => {
          console.warn("[reCAPTCHA] reCAPTCHA challenge expired.");
        }
      });
    }
  };

  // Send SMS Verification Code
  const handleSendPhoneOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setPhoneMessage('Please enter a valid 10-digit phone number.');
      return;
    }
    
    console.log("[OTP Send] Initiating OTP send for phone number:", phone);
    setIsPhoneLoading(true);
    setPhoneMessage('');
    dispatch(authStart());
    
    try {
      setupRecaptcha();
      // Clean phone number to get last 10 digits
      const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
      const formatPhone = `+91${cleanedPhone}`;
      const appVerifier = window.recaptchaVerifier;
      
      console.log("[OTP Send] Calling signInWithPhoneNumber for phone:", formatPhone);
      const confirmationResult = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      console.log("[OTP Send] signInWithPhoneNumber success! Confirmation result received.");
      
      setPhoneConfirmationResult(confirmationResult);
      setShowPhoneOtpField(true);
      setPhoneMessage('SMS Verification Code sent successfully. Please enter the code below.');
      dispatch(authFailure(null)); // clear loading state
    } catch (err) {
      console.error('[OTP Send] Error occurred:', err);
      let errMsg = 'Failed to send SMS OTP. Please try again.';
      if (err.code === 'auth/invalid-phone-number') {
        errMsg = 'Invalid phone number format.';
      } else if (err.code === 'auth/too-many-requests') {
        errMsg = 'Too many requests. Please try again later.';
      } else {
        errMsg = err.message || errMsg;
      }
      setPhoneMessage(errMsg);
      dispatch(authFailure(errMsg));
      if (window.recaptchaVerifier) {
        console.log("[OTP Send] Clearing recaptchaVerifier on error.");
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsPhoneLoading(false);
    }
  };

  // Verify SMS Code
  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    if (!phoneOtp || phoneOtp.length < 6) {
      setPhoneMessage('Please enter the 6-digit OTP code.');
      return;
    }
    
    console.log("[OTP Verify] Starting OTP verification for code:", phoneOtp);
    setIsVerifying(true);
    setPhoneMessage('');
    dispatch(authStart());
    
    try {
      if (!phoneConfirmationResult) {
        console.error("[OTP Verify] confirmationResult is null!");
        throw new Error('No active verification session found. Please request OTP again.');
      }
      
      console.log("[OTP Verify] Calling confirmationResult.confirm()...");
      const result = await phoneConfirmationResult.confirm(phoneOtp);
      console.log("[OTP Verify] confirmationResult.confirm() success! Firebase user uid:", result.user.uid);
      
      console.log("[OTP Verify] Retrieving Firebase ID token...");
      const idToken = await result.user.getIdToken();
      console.log("[OTP Verify] Firebase ID token retrieved successfully.");
      
      console.log("[OTP Verify] Syncing token with backend...");
      await handleFirebaseSync(idToken);
      console.log("[OTP Verify] Flow complete!");
    } catch (err) {
      console.error('[OTP Verify] Verification Error caught:', err);
      let errMsg = 'OTP verification failed. Please try again.';
      if (err.code === 'auth/invalid-verification-code') {
        errMsg = 'Invalid OTP code. Please check and try again.';
      } else if (err.code === 'auth/code-expired') {
        errMsg = 'OTP code has expired. Please request a new one.';
      } else {
        errMsg = err.message || errMsg;
      }
      setPhoneMessage(errMsg);
      dispatch(authFailure(errMsg));
    } finally {
      setIsVerifying(false);
      console.log("[OTP Verify] Loader state reset in finally block.");
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    console.log("[Google Auth] Initiating Google Sign-In popup...");
    dispatch(authStart());
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("[Google Auth] Google login success! Firebase user uid:", result.user.uid);
      
      const idToken = await result.user.getIdToken();
      await handleFirebaseSync(idToken);
    } catch (err) {
      console.error('[Google Auth] Error caught:', err);
      let errMsg = 'Google Sign-In failed.';
      if (err.code === 'auth/popup-blocked') {
        errMsg = 'Google login popup was blocked by your browser. Please enable popups and try again.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        errMsg = 'Google login popup closed before completing authentication.';
      } else {
        errMsg = err.message || errMsg;
      }
      dispatch(authFailure(errMsg));
    }
  };

  const handleResetPhone = () => {
    console.log("[OTP Reset] User requested change of phone number. Resetting state.");
    setShowPhoneOtpField(false);
    setPhoneOtp('');
    setPhoneMessage('');
    setPhoneConfirmationResult(null);
    if (window.recaptchaVerifier) {
      console.log("[OTP Reset] Clearing recaptchaVerifier.");
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  };

  const handleResetEmail = () => {
    console.log("[Email OTP Reset] Going back to email entry.");
    setShowEmailOtpField(false);
    setEmailOtp('');
    setEmailMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-slate-950 overflow-hidden">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      
      {/* Visual background lights */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10 shadow-2xl border border-slate-800 animate-fadeIn">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-gradient-to-tr from-cyan-400 to-sky-600 p-4 rounded-2xl text-slate-955 shadow-xl mb-4">
            <FlaskConical className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">
            Chemistry by Ravi Raushan Sir
          </h1>
          <p className="text-xs text-slate-450 mt-1 font-semibold tracking-wider uppercase flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-400" />
            Class 11 & 12 Board + NEET/JEE Preparation
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 p-3 rounded-xl text-xs font-semibold mb-6 text-center">
            {error}
          </div>
        )}

        {/* Target Class selector */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Select Your Target Class
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['11', '12', 'Other'].map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedClass === cls
                    ? 'bg-cyan-500/15 text-cyan-400 border-cyan-400/40 shadow-md'
                    : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-850'
                }`}
              >
                Class {cls === 'Other' ? 'Other' : cls}
              </button>
            ))}
          </div>
        </div>

        {/* Email OTP Verification (Nodemailer) */}
        {loginMethod === 'email' ? (
          <div className="pt-4 border-t border-slate-800/60">
            <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center">
              <Mail className="w-4 h-4 mr-2 text-cyan-400" />
              <span>Login with Email OTP</span>
            </h2>
            {!showEmailOtpField ? (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Mail className="w-4 h-4 text-slate-450" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400/80 transition-colors"
                    />
                  </div>
                  {emailSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 animate-fadeIn max-h-24 overflow-y-auto pr-1">
                      {emailSuggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setEmail(sug)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 hover:bg-slate-850 text-slate-350 hover:text-cyan-400 text-[10px] font-bold transition-all"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={isEmailLoading || loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-505 text-slate-950 font-extrabold py-3 rounded-xl transition-all text-xs shadow-lg flex items-center justify-center space-x-2"
                >
                  <LogIn className="w-4.5 h-4.5" />
                  <span>{isEmailLoading ? 'Requesting Code...' : 'Send Email OTP'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp} className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Enter Verification Code
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <KeyRound className="w-4 h-4 text-slate-450" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Enter 6-digit OTP code"
                      maxLength={6}
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400/85 text-center tracking-widest text-lg font-bold"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isVerifying || loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-505 text-slate-950 font-extrabold py-3 rounded-xl transition-all text-xs shadow-lg flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>{(isVerifying || loading) ? 'Verifying...' : 'Verify OTP & Log In'}</span>
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResetEmail}
                    className="text-xs text-cyan-400 hover:underline font-semibold"
                  >
                    Change Email / Go Back
                  </button>
                </div>
              </form>
            )}
            
            {emailMessage && (
              <p className="text-[11px] font-semibold text-cyan-400 mt-2.5 text-center leading-normal">
                {emailMessage}
              </p>
            )}
            
            <p className="text-[10px] text-slate-500 text-center font-medium mt-2 leading-normal">
              First time logging in? Your profile will be created automatically once verified.
            </p>
          </div>
        ) : (
          /* Real Firebase Phone OTP Verification */
          <div className="pt-4 border-t border-slate-800/60">
            <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center">
              <Phone className="w-4 h-4 mr-2 text-cyan-400" />
              <span>Sign In with Phone OTP</span>
            </h2>
            {!showPhoneOtpField ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm font-bold">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-12 pr-3 py-2.5 rounded-xl text-sm bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400/80 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPhoneLoading || loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-505 text-slate-950 font-extrabold py-3 rounded-xl transition-all text-xs shadow-lg flex items-center justify-center space-x-2"
                >
                  <LogIn className="w-4.5 h-4.5" />
                  <span>{isPhoneLoading ? 'Sending SMS...' : 'Send OTP via SMS'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Enter Verification OTP
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <KeyRound className="w-4 h-4 text-slate-450" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="6-digit OTP code"
                      maxLength={6}
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-400/85 text-center tracking-widest text-lg font-bold"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isVerifying || loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-505 text-slate-950 font-extrabold py-3 rounded-xl transition-all text-xs shadow-lg flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>{(isVerifying || loading) ? 'Verifying...' : 'Verify OTP & Log In'}</span>
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResetPhone}
                    className="text-xs text-cyan-400 hover:underline font-semibold"
                  >
                    Change Phone Number / Go Back
                  </button>
                </div>
              </form>
            )}
            {phoneMessage && (
              <p className="text-[11px] font-semibold text-cyan-400 mt-3 text-center leading-normal">
                {phoneMessage}
              </p>
            )}
          </div>
        )}

        {/* Divider and Switch Options */}
        <div className="space-y-4 pt-5 border-t border-slate-850/60 mt-5">
          {/* Switch Login Mode Trigger */}
          <div className="text-center">
            {loginMethod === 'email' ? (
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className="text-[11px] font-bold text-slate-400 hover:text-cyan-400 inline-flex items-center space-x-1 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 mr-1" />
                <span>Login via Mobile OTP</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className="text-[11px] font-bold text-slate-400 hover:text-cyan-400 inline-flex items-center space-x-1 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 mr-1" />
                <span>Login with Email OTP</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Google Social Sign-In */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-850 text-slate-200 font-bold py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all text-xs flex items-center justify-center space-x-2"
          >
            <Mail className="w-4 h-4 text-cyan-400" />
            <span>Continue with Google</span>
          </button>
        </div>

      </div>

      {/* Global stable reCAPTCHA container - placed outside forms so it is always present in DOM */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Login;
