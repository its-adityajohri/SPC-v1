async function authRoutes(fastify, options) {
    const authController = require('../controllers/authController');
  
    fastify.post('/register', authController.register);
    fastify.post('/verify-otp', authController.verifyOTP);
    fastify.post('/login', authController.login);
    fastify.post('/forgot-password', authController.forgotPassword);
    fastify.post('/reset-password', authController.resetPassword);
    fastify.post('/logout', authController.logout);
  }
  
  module.exports = authRoutes;
   