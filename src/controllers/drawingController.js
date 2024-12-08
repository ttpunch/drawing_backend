const Drawing = require('../models/Drawing');
const Comment = require('../models/Comment');
const cloudinary = require('../config/cloudinary');
const { ensureUploadDir } = require('../utils/fileUtils');
const fs = require('fs');
const path = require('path');

// Ensure upload directory exists on server start
ensureUploadDir();

// Get all drawings
exports.getAllDrawings = async (req, res) => {
  try {
    const drawings = await Drawing.find()
      .populate('user', 'name email')
      .sort('-createdAt');
    res.json(drawings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single drawing
exports.getDrawing = async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'name' }
      });

    if (!drawing) {
      return res.status(404).json({ message: 'Drawing not found' });
    }

    res.json(drawing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create drawing
exports.createDrawing = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);

    // Remove the file from local storage after successful upload
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Error removing local file:', err);
      }
    });

    const drawing = await Drawing.create({
      title: req.body.title,
      description: req.body.description,
      imageUrl: result.secure_url,
      cloudinaryId: result.public_id,
      user: req.user._id
    });

    res.status(201).json(drawing);
  } catch (error) {
    // If there's an error, try to remove the uploaded file
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Error removing local file after upload error:', err);
        }
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Update drawing
exports.updateDrawing = async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);

    if (!drawing) {
      return res.status(404).json({ message: 'Drawing not found' });
    }

    // Check if user owns the drawing
    if (drawing.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this drawing' });
    }

    const updatedDrawing = await Drawing.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title, description: req.body.description },
      { new: true }
    );

    res.json(updatedDrawing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete drawing
exports.deleteDrawing = async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);

    if (!drawing) {
      return res.status(404).json({ message: 'Drawing not found' });
    }

    // Check if user owns the drawing
    if (drawing.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this drawing' });
    }

    // Delete image from cloudinary
    if (drawing.cloudinaryId) {
      await cloudinary.uploader.destroy(drawing.cloudinaryId);
    }

    await drawing.deleteOne();
    await Comment.deleteMany({ drawing: req.params.id });

    res.json({ message: 'Drawing deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rate drawing
exports.rateDrawing = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const drawing = await Drawing.findById(id);
    if (!drawing) {
      return res.status(404).json({ message: 'Drawing not found' });
    }

    const existingRatingIndex = drawing.ratings.findIndex(r => 
      r.user.toString() === userId.toString()
    );

    if (existingRatingIndex > -1) {
      drawing.ratings[existingRatingIndex].value = rating;
    } else {
      drawing.ratings.push({ user: userId, value: rating });
    }

    const totalRating = drawing.ratings.reduce((sum, r) => sum + r.value, 0);
    drawing.averageRating = totalRating / drawing.ratings.length;

    await drawing.save();
    res.json(drawing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const drawingId = req.params.id;
    const { content } = req.body;
    const userId = req.user._id;

    // Input validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Find drawing
    const drawing = await Drawing.findById(drawingId);
    if (!drawing) {
      return res.status(404).json({ message: 'Drawing not found' });
    }

    // Create comment
    const comment = await Comment.create({
      content: content.trim(),
      user: userId,
      drawing: drawingId
    });

    // Populate user details
    await comment.populate('user', 'username name');

    // Add comment to drawing's comments array
    drawing.comments.push(comment._id);
    await drawing.save();

    // Return populated comment
    res.status(201).json({
      _id: comment._id,
      content: comment.content,
      user: comment.user,
      createdAt: comment.createdAt
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
};

// Get comments for a drawing
exports.getComments = async (req, res) => {
  try {
    const drawingId = req.params.id;
    const comments = await Comment.find({ drawing: drawingId })
      .populate('user', 'username name')
      .sort('-createdAt');

    res.json(comments);
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ message: 'Error getting comments' });
  }
};