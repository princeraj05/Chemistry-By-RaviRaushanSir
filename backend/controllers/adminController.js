import User from '../models/User.js';
import Course from '../models/Course.js';
import Video from '../models/Video.js';
import Payment from '../models/Payment.js';

/**
 * @desc    Get Admin Dashboard Stats
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin Only)
 */
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Students Count
    const totalStudents = await User.countDocuments({ role: 'student' });

    // 2. Total Revenue Aggregation
    const revenueAggregation = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

    // 3. Total Courses
    const totalCourses = await Course.countDocuments({});

    // 4. Total Videos
    const totalVideos = await Video.countDocuments({});

    // 5. Recent Purchases (limit to 5)
    const recentPurchases = await Payment.find({ status: 'success' })
      .populate('userId', 'name email')
      .populate('courseId', 'title category')
      .sort({ createdAt: -1 })
      .limit(5);

    // 6. Revenue Sales by Category (to populate admin dashboard charts)
    const salesByCategory = await Payment.aggregate([
      { $match: { status: 'success' } },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      { $unwind: '$courseDetails' },
      {
        $group: {
          _id: '$courseDetails.category',
          value: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalRevenue,
        totalCourses,
        totalVideos,
        recentPurchases,
        salesByCategory
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc    Get list of all students with search capability
 * @route   GET /api/admin/students
 * @access  Private (Admin Only)
 */
export const getStudents = async (req, res) => {
  const { search } = req.query;

  try {
    let query = { role: 'student' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .populate('purchasedCourses', 'title category price')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc    Get list of all transactions
 * @route   GET /api/admin/payments
 * @access  Private (Admin Only)
 */
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Payment.find({})
      .populate('userId', 'name email phone class')
      .populate('courseId', 'title category price')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};
