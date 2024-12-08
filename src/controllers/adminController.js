const User = require('../models/User');
const Drawing = require('../models/Drawing');
const Comment = require('../models/Comment');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set status to active for admin users if pending
    if (user.status === 'pending') {
      user.status = 'active';
      await user.save();
    }

    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        username: user.username
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login' });
  }
};

// Get admin stats
exports.getAdminStats = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: 'Database connection error' });
    }

    const [totalUsers, pendingUsers, totalDrawings, totalComments] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'pending' }),
      Drawing.countDocuments(),
      Comment.countDocuments()
    ]);

    res.json({
      totalUsers,
      pendingUsers,
      totalDrawings,
      totalComments
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching admin statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select('-password')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      User.countDocuments()
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      users,
      currentPage: page,
      totalPages,
      totalUsers: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve user
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject user
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role' });
  }
};

// Delete drawing
exports.deleteDrawing = async (req, res) => {
  try {
    const { id } = req.params;
    
    const drawing = await Drawing.findById(id);
    if (!drawing) {
      return res.status(404).json({ message: 'Drawing not found' });
    }

    if (drawing.cloudinaryId) {
      await cloudinary.uploader.destroy(drawing.cloudinaryId);
    }

    await Drawing.findByIdAndDelete(id);
    await Comment.deleteMany({ drawing: id });

    res.json({ message: 'Drawing deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting drawing',
      error: error.message 
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Drawing.deleteMany({ user: user._id });
    
    await Comment.deleteMany({ user: user._id });
    
    await user.deleteOne();

    res.json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get page views
exports.getPageViews = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    res.json({
      pageViews: 0
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching page views',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  adminLogin: exports.adminLogin,
  getAdminStats: exports.getAdminStats,
  getAllUsers: exports.getAllUsers,
  approveUser: exports.approveUser,
  rejectUser: exports.rejectUser,
  updateUserRole: exports.updateUserRole,
  deleteDrawing: exports.deleteDrawing,
  deleteUser: exports.deleteUser,
  getPageViews: exports.getPageViews
};