const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Drawing = require('../models/Drawing');
const Comment = require('../models/Comment');
require('dotenv').config();

const sampleData = {
  users: [
    {
      username: 'admin',
      email: 'admin@drawingtutorial.com',
      password: bcrypt.hashSync('admin123', 10),
      name: 'Admin User',
      role: 'admin',
      status: 'active',
      securityQuestion: 'What is your favorite book?',
      securityAnswer: 'admin123',
      profile: {
        experienceLevel: 'advanced',
        interests: ['teaching', 'art'],
        message: 'Platform administrator'
      }
    },
    {
      username: 'student1',
      email: 'student1@example.com',
      password: bcrypt.hashSync('student123', 10),
      name: 'John Doe',
      phone: '1234567890',
      role: 'student',
      status: 'active',
      securityQuestion: 'What was your first pet\'s name?',
      securityAnswer: 'fluffy',
      profile: {
        experienceLevel: 'beginner',
        interests: ['sketching', 'watercolor'],
        message: 'Excited to learn drawing!'
      }
    },
    {
      username: 'student2',
      email: 'student2@example.com',
      password: bcrypt.hashSync('student123', 10),
      name: 'Jane Smith',
      phone: '0987654321',
      role: 'student',
      status: 'pending',
      securityQuestion: 'What city were you born in?',
      securityAnswer: 'london',
      profile: {
        experienceLevel: 'intermediate',
        interests: ['digital art', 'portraits'],
        message: 'Looking to improve my skills'
      }
    }
  ],
  drawings: [
    {
      title: 'Basic Shapes Tutorial',
      description: 'Learn how to draw basic shapes step by step',
      imageUrl: 'https://res.cloudinary.com/your-cloud-name/image/upload/shapes.jpg',
      cloudinaryId: 'drawings/shapes',
      comments: [],
      ratings: [],
      averageRating: 0
    },
    {
      title: 'Portrait Fundamentals',
      description: 'Master the art of portrait drawing',
      imageUrl: 'https://res.cloudinary.com/your-cloud-name/image/upload/portrait.jpg',
      cloudinaryId: 'drawings/portrait',
      comments: [],
      ratings: [],
      averageRating: 0
    }
  ],
  comments: [
    {
      content: 'Great tutorial! Very helpful for beginners.',
      createdAt: new Date()
    },
    {
      content: 'Could you add more details about shading techniques?',
      createdAt: new Date()
    }
  ]
};

const seedDatabase = async () => {
  try {
    await mongoose.connect("mongodb+srv://vinod418:vinod12345@cluster0.zyud3js.mongodb.net/drawing_backend", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');

    // Clear existing data
    await User.deleteMany({});
    await Drawing.deleteMany({});
    await Comment.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = await User.create(sampleData.users);
    console.log('Users created');

    // Create drawings
    const drawings = await Drawing.create(sampleData.drawings);
    console.log('Drawings created');

    // Create comments
    await Promise.all(
      sampleData.comments.map(async (comment) => {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomDrawing = drawings[Math.floor(Math.random() * drawings.length)];
        return Comment.create({
          ...comment,
          user: randomUser._id,
          drawing: randomDrawing._id
        });
      })
    );
    console.log('Comments created');

    console.log('\nSample data created successfully!');
    console.log('\nAdmin credentials:');
    console.log('Username:', sampleData.users[0].username);
    console.log('Password:', 'admin123');
    
    console.log('\nSample user credentials:');
    sampleData.users.forEach(user => {
      console.log(`Username: ${user.username}, Password: ${user.password}, Approved: ${user.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();