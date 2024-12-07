const express = require('express');
const router = express.Router();
const { enroll } = require('../controllers/enrollmentController');

// POST /api/enroll - Submit enrollment form
router.post('/', enroll);

// POST /api/admin/enroll - Submit enrollment form for admin
router.post('/admin', enroll);

module.exports = router;
