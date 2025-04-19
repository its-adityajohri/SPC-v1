// announcementController.js
'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/teacher/announcements
async function createAnnouncement(req, reply) {
  const teacherId = req.userId;
  const { title, message, targetGroup } = req.body;
  const ann = await prisma.announcement.create({
    data: { teacherId, title, message, targetGroup }
  });
  return reply.code(201).send({ message: 'Created', announcement: ann });
}

// GET /api/teacher/announcements
async function listAnnouncements(req, reply) {
  const teacherId = req.userId;
  const anns = await prisma.announcement.findMany({ where: { teacherId } });
  return reply.send({ announcements: anns });
}

// PUT /api/teacher/announcements/:id
async function updateAnnouncement(req, reply) {
  const { id } = req.params;
  const data = req.body;
  const ann = await prisma.announcement.update({ where: { id }, data });
  return reply.send({ message: 'Updated', announcement: ann });
}

// DELETE /api/teacher/announcements/:id
async function deleteAnnouncement(req, reply) {
  const { id } = req.params;
  await prisma.announcement.delete({ where: { id } });
  return reply.send({ message: 'Deleted' });
}

module.exports = {
  createAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  deleteAnnouncement
};
