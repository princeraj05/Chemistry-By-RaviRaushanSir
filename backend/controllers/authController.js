import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyFirebaseToken } from '../config/firebase.js';
import User from '../models/User.js';
import Otp from '../models/Otp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

// Helper to sign JWT
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'super_secret_jwt_token_for_chemistry_coaching_platform', 
    { expiresIn: '30d' }
  );
};

/**
 * @desc    Verify Firebase token, register/login user, return JWT
 * @route   POST /api/auth/firebase
 * @access  Public
 */
export const firebaseLoginUser = async (req, res) => {
  const { firebaseToken, class: className } = req.body;

  if (!firebaseToken) {
    return res.status(400).json({ success: false, message: 'Firebase token is required.' });
  }

  try {
    // 1. Verify token
    const decodedToken = await verifyFirebaseToken(firebaseToken);
    const { uid, name, email, phone_number } = decodedToken;

    // 2. Resolve email (required by MongoDB user schema)
    let resolvedEmail = email;
    if (!resolvedEmail) {
      if (phone_number) {
        resolvedEmail = `phone_${phone_number.replace('+', '')}@chemistry-coaching.com`;
      } else {
        resolvedEmail = `firebase_${uid}@chemistry-coaching.com`;
      }
    }

    // 3. Resolve name
    let resolvedName = req.body.name || name || decodedToken.displayName;
    if (!resolvedName) {
      if (phone_number) {
        resolvedName = `Student (${phone_number.slice(-4)})`;
      } else if (resolvedEmail) {
        const prefix = resolvedEmail.split('@')[0];
        resolvedName = prefix.split(/[^a-zA-Z0-9]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      } else {
        resolvedName = 'New Chemistry Student';
      }
    }

    // 4. Find or create user
    let user = await User.findOne({ 
      $or: [{ firebaseUid: uid }, { email: resolvedEmail.toLowerCase() }]
    });

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        name: resolvedName,
        email: resolvedEmail.toLowerCase(),
        phone: phone_number || '',
        role: 'student', // Always student by default for security, admin role is upgraded manually
        class: className || 'Other',
        purchasedCourses: [],
        likedVideos: []
      });
      console.log(`Created new Firebase user: ${user.name} (${user.email}) as student`);
    } else {
      // Update firebaseUid / phone if they were not set (e.g. matched on email)
      let updated = false;
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        updated = true;
      }
      if (phone_number && !user.phone) {
        user.phone = phone_number;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    // 5. Generate custom JWT
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        class: user.class,
        purchasedCourses: user.purchasedCourses,
        likedVideos: user.likedVideos,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Firebase Login Error:', error);
    return res.status(500).json({ success: false, message: 'Authentication failed.', error: error.message });
  }
};

/**
 * @desc    Get user profile details
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('purchasedCourses');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  const { name, phone, class: userClass } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (userClass) user.class = userClass;

    const updatedUser = await user.save();
    return res.status(200).json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        class: updatedUser.class,
        purchasedCourses: updatedUser.purchasedCourses,
        likedVideos: updatedUser.likedVideos
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc    Generate and send 6-digit OTP code to student email
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
export const sendEmailOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  try {
    // Reload environment variables dynamically on every request using absolute path & override
    dotenv.config({ path: envPath, override: true });

    // Generate 6 digit OTP code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Upsert in database
    await Otp.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp: generatedOtp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Print to server logs
    console.log(`\n--------------------------------------------`);
    console.log(`[EMAIL OTP] Generated code for: ${email}`);
    console.log(`[EMAIL OTP] OTP Code is: ${generatedOtp}`);
    console.log(`[EMAIL OTP] (Mock bypass code: 123456)`);
    console.log(`[EMAIL OTP] Configured Sender Email: ${process.env.EMAIL_USER}`);
    console.log(`--------------------------------------------\n`);

    // Send email using Nodemailer if SMTP details are configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        console.log(`[EMAIL OTP] Setting up Nodemailer transport for user: ${process.env.EMAIL_USER}`);
        const activeTransporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: false, 
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        const mailOptions = {
          from: `"Chemistry by Ravi Raushan Sir" <${process.env.EMAIL_USER}>`,
          to: email.toLowerCase(),
          subject: `${generatedOtp} is your Chemistry Coaching Verification Code`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 25px; background: linear-gradient(135deg, #0f172a 0%, #020617 100%); color: #f8fafc; border-radius: 16px; max-width: 500px; border: 1px solid #1e293b; margin: auto;">
              <h2 style="color: #0ea5e9; text-align: center; margin-bottom: 5px; font-weight: 800; letter-spacing: -0.5px;">Chemistry Coaching Portal</h2>
              <p style="text-align: center; font-size: 11px; color: #0284c7; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0;">Ravi Raushan Sir</p>
              <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />
              <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6; margin-bottom: 25px;">Hello,</p>
              <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6; margin-bottom: 25px;">You requested a verification code to access your student dashboard. Please use the following 6-digit OTP code:</p>
              <div style="background-color: rgba(14, 165, 233, 0.05); padding: 18px; text-align: center; border-radius: 12px; margin: 25px auto; border: 1px solid rgba(14, 165, 233, 0.2); max-width: 200px;">
                <span style="font-size: 32px; font-weight: 900; letter-spacing: 4px; color: #38bdf8; display: block;">${generatedOtp}</span>
              </div>
              <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 25px; line-height: 1.5;">This verification code is valid for 5 minutes.<br />If you did not request this, you can safely ignore this email.</p>
            </div>
          `
        };

        await activeTransporter.sendMail(mailOptions);
        console.log(`[EMAIL OTP] Live Email sent successfully to ${email}`);
        
        return res.status(200).json({ 
          success: true, 
          message: `Verification OTP sent to your email (${email.toLowerCase()}).`
        });
      } catch (err) {
        console.error('Nodemailer SMTP Dispatch Error:', err);
        return res.status(500).json({
          success: false,
          message: `Failed to send email OTP: ${err.message}`
        });
      }
    } else {
      console.log(`[EMAIL OTP] SMTP parameters not set in .env. Falling back to console-only logs.`);
      return res.status(200).json({ 
        success: true, 
        message: 'SMTP credentials not configured. OTP generated on server console. Enter 123456 or check console.'
      });
    }
  } catch (error) {
    console.error('Error generating Email OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP.', error: error.message });
  }
};

/**
 * @desc    Verify OTP code and log in/register user
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyEmailOtp = async (req, res) => {
  const { email, otp, className } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  try {
    const lowercaseEmail = email.toLowerCase();
    
    // Find valid OTP record
    const otpRecord = await Otp.findOne({ email: lowercaseEmail, otp });
    
    // Bypass verification code '123456' for developer convenience
    const isDeveloperBypass = otp === '123456';

    if (!otpRecord && !isDeveloperBypass) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
    }

    // Delete the OTP code from DB once verified
    if (otpRecord) {
      await Otp.deleteOne({ _id: otpRecord._id });
    }

    // Login/Signup User logic
    let user = await User.findOne({ email: lowercaseEmail });

    if (!user) {
      // Create user record
      const prefix = lowercaseEmail.split('@')[0];
      const name = prefix.split(/[^a-zA-Z0-9]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      user = await User.create({
        firebaseUid: `otp-uid-${lowercaseEmail}-${Date.now()}`,
        name: name || 'New Chemistry Student',
        email: lowercaseEmail,
        phone: '',
        role: 'student', // Always student by default, role upgraded manually in database
        class: className || 'Other',
        purchasedCourses: [],
        likedVideos: []
      });
      console.log(`Created new email-otp student profile: ${user.name}`);
    }

    // Generate custom JWT
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        class: user.class,
        purchasedCourses: user.purchasedCourses,
        likedVideos: user.likedVideos,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Verify Email OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP.', error: error.message });
  }
};
