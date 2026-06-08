import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protects route by verifying JWT token
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'super_secret_jwt_token_for_chemistry_coaching_platform'
      );

      // Find user and attach to request
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found in database.' });
      }

      next();
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token verification failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing.' });
  }
};

/**
 * Ensures user has Admin permissions
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied: Admin role required.' });
  }
};
