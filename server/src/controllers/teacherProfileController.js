// teacherProfileController.js
'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/teacher/profile
async function getProfile(req, reply) {
  const userId = req.userId; // assuming auth middleware sets this
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, role: true, profile: true }
  });
  return reply.send({ user });
}

// PUT /api/teacher/profile
async function updateProfile(req, reply) {
  const userId = req.userId;
  const { displayName, bio } = req.body;
  let profile = await prisma.profile.findUnique({ where: { userId } });
  if (profile) {
    profile = await prisma.profile.update({
      where: { userId },
      data: { displayName, bio }
    });
  } else {
    profile = await prisma.profile.create({
      data: { userId, displayName, bio }
    });
  }
  return reply.send({ message: 'Profile saved', profile });
}

// GET /api/teacher/dashboard-settings
async function getDashboardSettings(req, reply) {
  const teacherId = req.userId;
  const ds = await prisma.dashboardSetting.findUnique({ where: { teacherId } });
  return reply.send({ settings: ds });
}

// PUT /api/teacher/dashboard-settings
async function updateDashboardSettings(req, reply) {
  const teacherId = req.userId;
  const { preferences } = req.body;
  let ds = await prisma.dashboardSetting.findUnique({ where: { teacherId } });
  if (ds) {
    ds = await prisma.dashboardSetting.update({
      where: { teacherId },
      data: { preferences }
    });
  } else {
    ds = await prisma.dashboardSetting.create({
      data: { teacherId, preferences }
    });
  }
  return reply.send({ message: 'Settings updated', settings: ds });
}

module.exports = {
  getProfile,
  updateProfile,
  getDashboardSettings,
  updateDashboardSettings
};
