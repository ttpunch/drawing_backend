const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const {
  getAllEnrollments,
  updateEnrollmentStatus
} = require('../controllers/adminEnrollmentController');

// GET /api/admin/enrollments - Get all enrollments
router.get('/enrollments', isAdmin, getAllEnrollments);

// PATCH /api/admin/enrollments/:id/status - Update enrollment status
router.patch('/enrollments/:id/status', isAdmin, updateEnrollmentStatus);

module.exports = router;
