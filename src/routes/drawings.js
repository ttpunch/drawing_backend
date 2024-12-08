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

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
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

// Public routes
router.get('/', getAllDrawings);
router.get('/:id', getDrawing);

// Protected routes
router.use(protect);
router.post('/', upload.single('image'), createDrawing);
router.put('/:id', updateDrawing);
router.delete('/:id', deleteDrawing);

// Comment and rating routes
router.post('/:id/comments', addComment);
router.post('/:id/rate', rateDrawing);

module.exports = router;