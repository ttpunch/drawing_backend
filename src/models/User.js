const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: function() {
      return this.role !== 'admin' && !this.googleId;
    },
    select: false
  },
  name: {
    type: String,
    required: function() {
      return this.role !== 'admin';
    }
  },
  phone: {
    type: String
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected'],
    default: 'pending'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  securityQuestion: {
    type: String,
    required: true,
    enum: [
      'What is your mother\'s maiden name?',
      'What was your first pet\'s name?',
      'What city were you born in?',
      'What is your favorite book?',
      'What was the name of your first school?'
    ]
  },
  securityAnswer: {
    type: String,
    required: true,
    select: false
  },
  profile: {
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    interests: [{
      type: String
    }],
    message: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') && !this.isModified('securityAnswer')) {
    return next();
  }

  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  if (this.isModified('securityAnswer')) {
    this.securityAnswer = await bcrypt.hash(this.securityAnswer.toLowerCase(), 10);
  }

  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to compare security answer
userSchema.methods.compareSecurityAnswer = async function(candidateAnswer) {
  return bcrypt.compare(candidateAnswer.toLowerCase(), this.securityAnswer);
};

module.exports = mongoose.model('User', userSchema);