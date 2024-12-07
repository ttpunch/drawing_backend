const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send status update email
const sendStatusUpdateEmail = async (user, status) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: `Enrollment Status Update - ${status.toUpperCase()}`,
    html: `
      <h2>Hello ${user.name}!</h2>
      <p>Your enrollment status has been updated to: <strong>${status}</strong></p>
      ${status === 'active' 
        ? '<p>You can now log in to your account using your email and the temporary password sent earlier.</p>' 
        : '<p>If you have any questions, please contact our support team.</p>'
      }
    `
  };

  return transporter.sendMail(mailOptions);
};

// Log admin activity
const logAdminActivity = async (adminId, userId, action, details) => {
  try {
    await AuditLog.create({
      userId: adminId,
      targetUserId: userId,
      action,
      details,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging admin activity:', error);
  }
};

// Get all enrollments
exports.getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await User.find({ role: 'student' })
      .select('name email phone status profile createdAt')
      .sort('-createdAt');

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

// Update enrollment status
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'active', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: pending, active, rejected' 
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user status
    user.status = status;
    await user.save();

    // Send email notification
    await sendStatusUpdateEmail(user, status);

    // Log the action
    await logAdminActivity(req.user._id, user._id, 'UPDATE_ENROLLMENT_STATUS', {
      previousStatus: user.status,
      newStatus: status,
      timestamp: new Date()
    });

    res.json({ 
      success: true,
      message: 'Enrollment status updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating enrollment status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
