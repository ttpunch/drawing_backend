const express = require('express');
const router = express.Router();
const passport = require('passport');
const { loginLimiter } = require('../middleware/rateLimiter');
const { register, login, getSecurityQuestion, resetPassword } = require('../controllers/authController');
const { enroll } = require('../controllers/enrollmentController');

// Regular authentication routes
router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/enroll', enroll);

// Forgot password routes
router.post('/forgot-password/question', getSecurityQuestion);
router.post('/forgot-password/reset', resetPassword);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: true
  }),
  (req, res) => {
    // Check if enrollment is complete
    if (req.user.status === 'pending') {
      res.redirect('/complete-enrollment');
    } else {
      res.redirect('/dashboard');
    }
  }
);

// Complete enrollment after Google OAuth
router.post('/complete-enrollment', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please login first' 
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update user with enrollment information
    user.phone = req.body.phone;
    user.experienceLevel = req.body.experienceLevel;
    user.interests = req.body.interests;
    user.status = 'pending'; // Keep as pending until admin approves

    await user.save();

    // Notify admin about new enrollment
    await sendEnrollmentNotification(process.env.ADMIN_EMAIL, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      experienceLevel: user.experienceLevel,
      interests: user.interests
    });

    res.status(200).json({
      success: true,
      message: 'Enrollment completed successfully. Pending admin approval.',
      userId: user._id
    });

  } catch (error) {
    console.error('Complete enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing enrollment',
      error: error.message
    });
  }
});

module.exports = router;