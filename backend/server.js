import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[HTTP] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Enable CORS
app.use(cors());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Routing Layers
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Base Status Route
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Chemistry Coaching Platform API is running smoothly.',
    version: '1.0.0'
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Global Error Logger:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Server Initialization
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
export default app;
