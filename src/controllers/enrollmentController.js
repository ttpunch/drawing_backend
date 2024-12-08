const Enrollment = require('../models/Enrollment');
const AuditLog = require('../models/AuditLog');

// Log enrollment activity
const logEnrollmentActivity = async (enrollmentId, action, details) => {
  try {
    await AuditLog.create({
      enrollmentId,
      action,
      details,
      timestamp: new Date()
    });
  } catch (error) {
    // Removed console log
  }
};

exports.enroll = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      experienceLevel,
      interests,
      message
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !experienceLevel || !interests) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create a new enrollment application
    const enrollment = await Enrollment.create({
      name,
      email,
      phone,
      experienceLevel,
      interests,
      message,
      status: 'pending'
    });

    // Log the enrollment activity
    await logEnrollmentActivity(enrollment._id, 'ENROLLMENT_SUBMITTED', 'New enrollment application submitted');

    res.status(201).json({
      success: true,
      message: 'Enrollment application submitted successfully',
      data: enrollment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit enrollment application',
      error: error.message
    });
  }
};

// Get all enrollments (admin only)
exports.getAllEnrollments = async (req, res) => {
  try {
    // Verify admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const enrollments = await Enrollment.find()
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    // Removed console log
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollments',
      error: error.message
    });
  }
};

// Update enrollment status (admin only)
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    // Verify admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const enrollment = await Enrollment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Log the status update
    await logEnrollmentActivity(
      enrollment._id,
      'STATUS_UPDATED',
      `Enrollment status updated to ${status}`
    );

    res.status(200).json({
      success: true,
      message: 'Enrollment status updated successfully',
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update enrollment status',
      error: error.message
    });
  }
};
