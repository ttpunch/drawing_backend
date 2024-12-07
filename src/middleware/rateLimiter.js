const rateLimit = require('express-rate-limit');

exports.loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again after 15 minutes'
});

exports.apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour
  message: 'Too many requests from this IP, please try again after an hour'
});