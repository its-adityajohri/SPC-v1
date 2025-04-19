// submissionController.js
'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/teacher/submissions/assignments
async function listAssignmentSubmissions(req, reply) {
  const { assignmentId, classId } = req.query;
  const subs = await prisma.assignmentSubmission.findMany({ where: { assignmentId, classId } });
  return reply.send({ submissions: subs });
}

// GET /api/teacher/submissions/assignments/:id
async function getAssignmentSubmission(req, reply) {
  const { id } = req.params;
  const sub = await prisma.assignmentSubmission.findUnique({ where: { id } });
  if (!sub) return reply.code(404).send({ error: 'Not found' });
  return reply.send({ submission: sub });
}

// POST /api/teacher/submissions/assignments/:id/feedback
async function feedbackAssignment(req, reply) {
  const { id } = req.params;
  const { score, feedback } = req.body;
  const sub = await prisma.assignmentSubmission.update({
    where: { id },
    data: { score, feedback }
  });
  return reply.send({ message: 'Feedback saved', submission: sub });
}

// Quiz equivalents
async function listQuizSubmissions(req, reply) {
  const { quizId, classId } = req.query;
  const subs = await prisma.quizSubmission.findMany({ where: { quizId, classId } });
  return reply.send({ submissions: subs });
}

async function getQuizSubmission(req, reply) {
  const { id } = req.params;
  const sub = await prisma.quizSubmission.findUnique({ where: { id } });
  if (!sub) return reply.code(404).send({ error: 'Not found' });
  return reply.send({ submission: sub });
}

async function feedbackQuiz(req, reply) {
  const { id } = req.params;
  const { score, feedback } = req.body;
  const sub = await prisma.quizSubmission.update({
    where: { id },
    data: { score, feedback }
  });
  return reply.send({ message: 'Feedback saved', submission: sub });
}

module.exports = {
  listAssignmentSubmissions,
  getAssignmentSubmission,
  feedbackAssignment,
  listQuizSubmissions,
  getQuizSubmission,
  feedbackQuiz,
};
