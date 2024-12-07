const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const {
  adminLogin,
  getAllUsers,
  approveUser,
  rejectUser,
  updateUserRole,
  getAdminStats,
  deleteDrawing,
  deleteUser,
  getPageViews
} = require('../controllers/adminController');

const {
  getAllEnrollments,
  updateEnrollmentStatus
} = require('../controllers/enrollmentController');

// Admin login route (no auth required)
router.post('/login', loginLimiter, adminLogin);

// Apply authentication middleware to all routes below
router.use(protect);
router.use(isAdmin);

// Admin routes
router.get('/stats', getAdminStats); // Stats endpoint
router.get('/stats/pageviews', getPageViews);
router.get('/users', getAllUsers);
router.patch('/users/:id/approve', approveUser);
router.patch('/users/:id/reject', rejectUser);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.delete('/drawings/:id', deleteDrawing);

// Admin enrollment routes
router.get('/enrollments', getAllEnrollments);
router.patch('/enrollments/:id/status', updateEnrollmentStatus);

module.exports = router;