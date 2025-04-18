const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient();

// Import mail service
const mailService = require('../services/mailService');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const TOKEN_EXPIRES_IN = '1d';

// Helper: Sign JWT token
function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

// Registration: Create or update user with OTP, then send OTP email.
async function register(req, reply) {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return reply.status(400).send({ error: 'Email, username, and password are required.' });
  }

  try {
    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (user && user.verified) {
      return reply.status(400).send({ error: 'User already exists. Please log in.' });
    }

    // Generate a 6-digit OTP and expiry time (10 minutes)
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const passwordHash = await bcrypt.hash(password, 10);

    if (!user) {
      // Create new user record
      user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          verified: false,
          otp,
          otpExpiry,
        },
      });
    } else {
      // Update existing unverified user
      user = await prisma.user.update({
        where: { email },
        data: {
          username,
          passwordHash,
          otp,
          otpExpiry,
        },
      });
    }

    // Send OTP email (stubbed)
    const mailDetails = {
      to: email,
      subject: 'Your Registration OTP',
      text: `Your OTP for registration is: ${otp}`,
    };
    await mailService.sendEmail(mailDetails);

    return reply.status(200).send({ message: 'OTP sent to email. Please verify to complete registration.' });
  } catch (error) {
    console.error('Registration error:', error);
    return reply.status(500).send({ error: 'Internal server error during registration.' });
  }
}

// Verify OTP: Confirm OTP and mark user as verified, then issue JWT.
async function verifyOTP(req, reply) {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return reply.status(400).send({ error: 'Email and OTP are required.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return reply.status(400).send({ error: 'User not found.' });
  }
  if (user.verified) {
    return reply.status(400).send({ error: 'User already verified. Please log in.' });
  }
  if (!user.otp || user.otp !== otp || new Date() > user.otpExpiry) {
    return reply.status(400).send({ error: 'Invalid or expired OTP.' });
  }

  // Mark user as verified and clear OTP fields
  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      verified: true,
      otp: null,
      otpExpiry: null,
    },
  });

  const token = signToken(updatedUser.id);
  reply.setCookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return reply.status(200).send({ message: 'User verified successfully.', token });
}

// Login: Validate credentials and issue JWT.
async function login(req, reply) {
  const { email, password } = req.body;
  if (!email || !password) {
    return reply.status(400).send({ error: 'Email and password are required.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.verified) {
    return reply.status(401).send({ error: 'Invalid credentials or user not verified.' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return reply.status(401).send({ error: 'Invalid credentials.' });
  }

  const token = signToken(user.id);
  reply.setCookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  return reply.status(200).send({ message: 'Logged in successfully.', token });
}

// Forgot Password: Generate a reset OTP and send email.
async function forgotPassword(req, reply) {
  const { email } = req.body;
  if (!email) {
    return reply.status(400).send({ error: 'Email is required.' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return reply.status(404).send({ error: 'User not found.' });
  }

  // Generate reset OTP (6-digit) and expiry (10 minutes)
  const resetOTP = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true,
  });
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: {
      passwordResetOTP: resetOTP,
      passwordResetExpiry: otpExpiry,
    },
  });

  const mailDetails = {
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP for password reset is: ${resetOTP}`,
  };
  await mailService.sendEmail(mailDetails);

  return reply.status(200).send({ message: 'Password reset OTP sent to email.' });
}

// Reset Password: Verify OTP and update password.
async function resetPassword(req, reply) {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return reply.status(400).send({ error: 'Email, OTP, and new password are required.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return reply.status(404).send({ error: 'User not found.' });
  }
  if (!user.passwordResetOTP || user.passwordResetOTP !== otp || new Date() > user.passwordResetExpiry) {
    return reply.status(400).send({ error: 'Invalid or expired OTP.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      passwordResetOTP: null,
      passwordResetExpiry: null,
    },
  });

  const token = signToken(user.id);
  reply.setCookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return reply.status(200).send({ message: 'Password reset successfully.', token });
}

// Logout: Clear the JWT cookie.
async function logout(req, reply) {
  reply.clearCookie('jwt', { path: '/' });
  return reply.status(200).send({ message: 'Logged out successfully.' });
}

module.exports = {
  register,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword,
  logout,
};
