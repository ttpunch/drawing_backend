const express = require('express');
const router = express.Router();
const multer = require('multer');
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
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

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