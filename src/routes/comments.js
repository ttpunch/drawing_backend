const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  getUserComments
} = require('../controllers/commentController');

// Get all comments for a drawing
router.get('/', getComments);

// Get comments by user ID
router.get('/user/:userId?', protect, getUserComments);

// Protected routes
router.use(protect);

// Add comment
router.post('/', addComment);

// Update comment
router.put('/:id', updateComment);

// Delete comment
router.delete('/:id', deleteComment);

module.exports = router;