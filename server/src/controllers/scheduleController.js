// calendarController.js
'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/teacher/calendar/event
async function createEvent(req, reply) {
  const teacherId = req.userId;
  const data = req.body; // { title, description, startsAt, endsAt }
  const ev = await prisma.calendarEvent.create({ data: { teacherId, ...data } });
  return reply.code(201).send({ event: ev });
}

// GET /api/teacher/calendar
async function listEvents(req, reply) {
  const teacherId = req.userId;
  const events = await prisma.calendarEvent.findMany({ where: { teacherId } });
  return reply.send({ events });
}

// PUT /api/teacher/calendar/event/:id
async function updateEvent(req, reply) {
  const { id } = req.params;
  const data = req.body;
  const ev = await prisma.calendarEvent.update({ where: { id }, data });
  return reply.send({ event: ev });
}

// DELETE /api/teacher/calendar/event/:id
async function deleteEvent(req, reply) {
  const { id } = req.params;
  await prisma.calendarEvent.delete({ where: { id } });
  return reply.send({ message: 'Deleted' });
}

// POST /api/teacher/timetable
async function createTimetable(req, reply) {
    const teacherId = req.userId;
    const { classId, schedule } = req.body;
    const tt = await prisma.timetable.create({ data: { teacherId, classId, schedule } });
    return reply.code(201).send({ timetable: tt });
  }
  
  // GET /api/teacher/timetable
  async function listTimetables(req, reply) {
    const teacherId = req.userId;
    const tts = await prisma.timetable.findMany({ where: { teacherId } });
    return reply.send({ timetables: tts });
  }
  
  // PUT /api/teacher/timetable/:id
  async function updateTimetable(req, reply) {
    const { id } = req.params;
    const data = req.body;
    const tt = await prisma.timetable.update({ where: { id }, data });
    return reply.send({ timetable: tt });
  }
  
  // DELETE /api/teacher/timetable/:id
  async function deleteTimetable(req, reply) {
    const { id } = req.params;
    await prisma.timetable.delete({ where: { id } });
    return reply.send({ message: 'Deleted' });
  }

module.exports = {
  createEvent,
  listEvents,
  updateEvent,
  deleteEvent,
  createTimetable,
  listTimetables,
  updateTimetable,
  deleteTimetable
};
