const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Drawing = require('../models/Drawing');
const Comment = require('../models/Comment');
const PageView = require('../models/PageView');
require('dotenv').config();

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Drawing.deleteMany({});
    await Comment.deleteMany({});
    await PageView.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@drawingtutorial.com',
      password: '12345',
      name: 'Admin User',
      role: 'admin',
      status: 'active',
      securityQuestion: 'What is your favorite book?',
      securityAnswer: '1to5',
      profile: {
        experienceLevel: 'advanced',
        interests: ['teaching', 'art'],
        message: 'Platform administrator'
      }
    });

    const student1 = await User.create({
      username: 'student1',
      email: 'student1@example.com',
      password: await bcrypt.hash('student123', 10),
      name: 'John Doe',
      phone: '1234567890',
      role: 'student',
      status: 'active',
      securityQuestion: 'What was your first pet\'s name?',
      securityAnswer: await bcrypt.hash('fluffy', 10),
      profile: {
        experienceLevel: 'beginner',
        interests: ['sketching', 'watercolor'],
        message: 'Excited to learn drawing!'
      }
    });

    const student2 = await User.create({
      username: 'student2',
      email: 'student2@example.com',
      password: await bcrypt.hash('student123', 10),
      name: 'Jane Smith',
      phone: '0987654321',
      role: 'student',
      status: 'pending',
      securityQuestion: 'What city were you born in?',
      securityAnswer: await bcrypt.hash('london', 10),
      profile: {
        experienceLevel: 'intermediate',
        interests: ['digital art', 'portraits'],
        message: 'Looking to improve my skills'
      }
    });

    console.log('Users created');

    // Create drawings
    const drawing1 = await Drawing.create({
      title: 'Basic Shapes Tutorial',
      description: 'Learn how to draw basic shapes step by step',
      imageUrl: 'https://res.cloudinary.com/your-cloud-name/image/upload/shapes.jpg',
      cloudinaryId: 'drawings/shapes',
      user: adminUser._id,
      comments: [],
      ratings: [
        { user: student1._id, value: 5 },
        { user: student2._id, value: 4 }
      ],
      averageRating: 4.5
    });

    const drawing2 = await Drawing.create({
      title: 'Portrait Fundamentals',
      description: 'Master the art of portrait drawing',
      imageUrl: 'https://res.cloudinary.com/your-cloud-name/image/upload/portrait.jpg',
      cloudinaryId: 'drawings/portrait',
      user: adminUser._id,
      comments: [],
      ratings: [
        { user: student1._id, value: 4 }
      ],
      averageRating: 4
    });

    console.log('Drawings created');

    // Create comments
    const comment1 = await Comment.create({
      content: 'Great tutorial! Very helpful for beginners.',
      drawing: drawing1._id,
      user: student1._id,
      createdAt: new Date()
    });

    const comment2 = await Comment.create({
      content: 'Could you add more details about shading techniques?',
      drawing: drawing1._id,
      user: student2._id,
      createdAt: new Date()
    });

    console.log('Comments created');

    // Update drawings with comments
    drawing1.comments = [comment1._id, comment2._id];
    await drawing1.save();

    // Create page views
    await PageView.create({
      count: 100,
      lastUpdated: new Date()
    });

    console.log('Page views created');

    console.log('\nSeed data created successfully!');
    console.log('\nAdmin credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\nStudent credentials:');
    console.log('Username: student1, Password: student123');
    console.log('Username: student2, Password: student123');

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
