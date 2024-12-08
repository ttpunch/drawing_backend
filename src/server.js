const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// Configure CORS
app.use(cors({
  origin: ['https://drawing-frontend.onrender.com', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const drawingRoutes = require('./routes/drawings');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');
const enrollmentRoutes = require('./routes/enrollment');

// Debug middleware - only in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    next();
  });
}

// Serve uploads directory statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/drawings', drawingRoutes);
app.use('/api/drawings/:drawingId/comments', commentRoutes);
app.use('/api/enroll', enrollmentRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({ 
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred'
  });
});

const PORT = process.env.PORT || 5173;

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  app.listen(PORT);
})
.catch(err => {
  process.exit(1);
});

module.exports = app;