const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      role: user.role
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: '30d'
    }
  );
};

exports.register = async (req, res) => {
  try {
    const { 
      username, 
      password, 
      email, 
      name, 
      phone, 
      securityQuestion, 
      securityAnswer 
    } = req.body;

    // Validate required fields
    if (!username || !password || !name || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: username, password, name, security question and answer' 
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [
        { username },
        ...(email ? [{ email }] : [])
      ]
    });

    if (userExists) {
      return res.status(400).json({ 
        message: userExists.username === username 
          ? 'Username already exists' 
          : 'Email already exists'
      });
    }

    // Create user with required fields
    const userData = {
      username,
      password,
      name,
      securityQuestion,
      securityAnswer,
      role: 'student',
      status: 'pending'
    };

    // Add optional fields if provided
    if (email) userData.email = email;
    if (phone) userData.phone = phone;

    const user = await User.create(userData);

    // Generate token but don't send sensitive data
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'Registration successful. Waiting for admin approval.',
      user: {
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Error in registration',
      error: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        username: user.username
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        status: user.status
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Error in login' });
  }
};

// Get security question for a user
exports.getSecurityQuestion = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username }).select('securityQuestion');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ securityQuestion: user.securityQuestion });
  } catch (error) {
    console.error('Error getting security question:', error);
    res.status(500).json({ message: 'Error getting security question' });
  }
};

// Verify security answer and reset password
exports.resetPassword = async (req, res) => {
  try {
    const { username, securityAnswer, newPassword } = req.body;
    const user = await User.findOne({ username }).select('+securityAnswer');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isAnswerCorrect = await user.compareSecurityAnswer(securityAnswer);
    if (!isAnswerCorrect) {
      return res.status(401).json({ message: 'Incorrect security answer' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
};