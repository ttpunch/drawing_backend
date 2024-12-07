const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();
const jwt = require('jsonwebtoken'); // Added jwt module
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

const User = require('./models/User');
const Drawing = require('./models/Drawing');
const Comment = require('./models/Comment');
const PageView = require('./models/PageView');

// Rate limiter for page views
const pageViewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware to track page views
app.use(pageViewLimiter);
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    // Fire and forget - don't await
    PageView.findOneAndUpdate(
      {},
      { 
        $inc: { count: 1 },
        lastUpdated: new Date()
      },
      { 
        upsert: true,
        new: true,
        setDefaultsOnInsert: true 
      }
    ).catch(error => {
      console.error('Error updating page views:', error);
    });
  }
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const drawingRoutes = require('./routes/drawings');
const commentRoutes = require('./routes/comments');

// Middleware for logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes); // Admin routes with built-in auth middleware
app.use('/drawings', drawingRoutes);
app.use('/comments', commentRoutes);

// Page views endpoint (separate from stats)
app.get('/stats/pageviews', async (req, res) => {
  try {
    console.log('Fetching page views...');
    const pageView = await PageView.findOne();
    
    if (!pageView) {
      console.log('No page views found, creating initial record');
      const newPageView = new PageView({ count: 0 });
      await newPageView.save();
      return res.json({ pageViews: 0 });
    }

    console.log('Page views found:', pageView.count);
    res.json({ pageViews: pageView.count });
  } catch (error) {
    console.error('Error fetching page views:', error);
    res.status(500).json({ message: 'Error fetching page views', error: error.message });
  }
});

// Admin stats endpoint (without page views)
app.get('/admin/stats', async (req, res) => {
  try {
    console.log('Fetching admin stats...');
    
    // Use Promise.all for parallel execution
    const [totalUsers, pendingUsers, totalDrawings, totalComments] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'pending' }),
      Drawing.countDocuments(),
      Comment.countDocuments()
    ]);

    const stats = {
      totalUsers,
      pendingUsers,
      totalDrawings,
      totalComments
    };
    
    console.log('Admin stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error in admin stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB Connected Successfully');
  // Test database connection by counting users
  return User.countDocuments();
})
.then(count => {
  console.log(`Database connection test: Found ${count} users`);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Handle MongoDB connection errors
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
