const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const {
  getAllDrawings,
  getDrawing,
  createDrawing,
  updateDrawing,
  deleteDrawing,
  addComment,
  rateDrawing
} = require('../controllers/drawingController');

// Configure multer for memory storage instead of disk storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image file.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

// Public routes
router.get('/', getAllDrawings);
router.get('/:id', getDrawing);

// Protected routes
router.use(protect);
router.post('/', upload.single('image'), handleMulterError, createDrawing);
router.put('/:id', updateDrawing);
router.delete('/:id', deleteDrawing);

// Comment and rating routes
router.post('/:id/comments', addComment);
router.post('/:id/rate', rateDrawing);

module.exports = router;