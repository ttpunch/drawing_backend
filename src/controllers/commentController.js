const Comment = require('../models/Comment');
const Drawing = require('../models/Drawing');

// Get comments for a drawing
exports.getComments = async (req, res) => {
  try {
    const { drawingId } = req.params;
    const comments = await Comment.find({ drawing: drawingId })
      .populate('user', 'username name')
      .sort('-createdAt');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a comment
exports.addComment = async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.drawingId);
    if (!drawing) {
      return res.status(404).json({ message: 'Drawing not found' });
    }

    const comment = await Comment.create({
      content: req.body.content,
      user: req.user._id,
      drawing: req.params.drawingId
    });

    await comment.populate('user', 'username name');
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a comment
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    comment.content = req.body.content;
    await comment.save();
    
    await comment.populate('user', 'username name');
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get comments by user ID
exports.getUserComments = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const comments = await Comment.find({ user: userId })
      .populate('drawing', 'title imageUrl')
      .populate('user', 'username name')
      .sort('-createdAt');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or is admin
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};