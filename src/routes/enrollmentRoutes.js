const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { isAdmin } = require('../middleware/auth');

// Public routes
router.post('/enroll', enrollmentController.enroll);

// Admin routes
router.get('/enrollments', isAdmin, enrollmentController.getAllEnrollments);
router.patch('/enrollments/:id/status', isAdmin, enrollmentController.updateEnrollmentStatus);

module.exports = router;
