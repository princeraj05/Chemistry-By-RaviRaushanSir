import crypto from 'crypto';
import Razorpay from 'razorpay';
import Course from '../models/Course.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

const isRazorpayMock = 
  !process.env.RAZORPAY_KEY_ID || 
  process.env.RAZORPAY_KEY_ID.includes('mock') ||
  !process.env.RAZORPAY_KEY_SECRET || 
  process.env.RAZORPAY_KEY_SECRET.includes('mock');

let razorpayInstance = null;

if (!isRazorpayMock) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('Razorpay configured successfully.');
  } catch (error) {
    console.error('Error configuring Razorpay:', error.message);
    razorpayInstance = null;
  }
} else {
  console.log('Razorpay credentials not configured. Running Razorpay in MOCK mode.');
}

const createRazorpayReceipt = (courseId) => {
  const timestamp = Date.now().toString(36);
  const courseSuffix = courseId.toString().slice(-8);
  return `rcpt_${timestamp}_${courseSuffix}`;
};

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/payments/order
 * @access  Private
 */
export const createOrder = async (req, res) => {
  const { courseId } = req.body;

  if (!courseId) {
    return res.status(400).json({ success: false, message: 'Course ID is required.' });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Verify if course is already purchased
    const alreadyPurchased = req.user.purchasedCourses.some(
      (purchasedCourseId) => purchasedCourseId.toString() === courseId
    );
    if (alreadyPurchased) {
      return res.status(400).json({ success: false, message: 'Course already purchased.' });
    }

    const amountInPaise = Math.round(Number(course.price) * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid course price.' });
    }

    const receipt = createRazorpayReceipt(courseId);

    // Handle mock payment order creation
    if (!razorpayInstance) {
      console.log(`Razorpay (Mock): Simulating order creation for course ${course.title} of price INR ${course.price}`);
      return res.status(200).json({
        success: true,
        isMock: true,
        order: {
          id: `order_mock_${Date.now()}`,
          amount: amountInPaise,
          currency: 'INR',
          receipt
        },
        keyId: 'rzp_test_mock_key_id'
      });
    }

    // Real Razorpay order creation
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        courseId: courseId.toString(),
        userId: req.user._id.toString()
      }
    };

    const order = await razorpayInstance.orders.create(options);
    return res.status(200).json({
      success: true,
      isMock: false,
      order,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    const gatewayMessage = error?.error?.description || error?.description || error?.message;
    return res.status(502).json({
      success: false,
      message: gatewayMessage || 'Failed to create payment order.'
    });
  }
};

/**
 * @desc    Verify Razorpay Signature and unlock Course
 * @route   POST /api/payments/verify
 * @access  Private
 */
export const verifyPayment = async (req, res) => {
  const { 
    courseId, 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    isMockPayment
  } = req.body;

  if (!courseId) {
    return res.status(400).json({ success: false, message: 'Course ID is required.' });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const amount = course.price;
    const userId = req.user._id;
    const isMockOrder = typeof razorpay_order_id === 'string' && razorpay_order_id.startsWith('order_mock_');
    const shouldUseMockVerification = !razorpayInstance && (isMockPayment || isMockOrder);

    if (!shouldUseMockVerification && (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)) {
      return res.status(400).json({ success: false, message: 'Payment verification details are required.' });
    }

    // 1. Verify payment signature
    let isValid = false;

    if (shouldUseMockVerification) {
      console.log(`Razorpay (Mock): Bypassing payment verification for ${razorpay_payment_id}`);
      isValid = true;
    } else {
      // Real signature verification
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      isValid = expectedSignature === razorpay_signature;
    }

    if (!isValid) {
      // Create a failed payment log
      await Payment.create({
        userId,
        courseId,
        amount,
        paymentId: razorpay_payment_id || 'failed_txn',
        status: 'failed'
      });

      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    // 2. Add course to purchased courses
    await User.findByIdAndUpdate(userId, {
      $addToSet: { purchasedCourses: courseId }
    });

    // 3. Create successful payment record
    const payment = await Payment.create({
      userId,
      courseId,
      amount,
      paymentId: razorpay_payment_id || `txn_mock_${Date.now()}`,
      status: 'success'
    });

    console.log(`Payment Verified: User ${req.user.name} purchased course ${course.title}`);

    return res.status(200).json({
      success: true,
      message: 'Course purchased successfully!',
      payment
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify payment.', error: error.message });
  }
};

/**
 * @desc    Get user's purchased course billing/payment history
 * @route   GET /api/payments/history
 * @access  Private
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const history = await Payment.find({ userId: req.user._id })
      .populate('courseId', 'title category thumbnail')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, history });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};
