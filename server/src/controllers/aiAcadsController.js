// aiPracticeController.js
'use strict';
const axios = require('axios');
const headers = { Authorization: `Bearer ${process.env.DEEPINFRA_API_KEY}` };

// POST /api/teacher/ai/practice-questions/generate
async function generatePracticeQuestions(req, reply) {
  const res = await axios.post(
    `${process.env.DEEPINFRA_API_URL}/practice-questions`,
    req.body,
    { headers }
  );
  return reply.send(res.data);
}

// POST /api/teacher/ai/deepseek/practice-questions
async function generateDeepPractice(req, reply) {
  const res = await axios.post(
    `${process.env.DEEPINFRA_API_URL}/deep-practice-questions`,
    req.body,
    { headers }
  );
  return reply.send(res.data);
}

// POST /api/teacher/ai/revision-notes/generate
async function generateRevisionNotes(req, reply) {
  const res = await axios.post(
    `${process.env.DEEPINFRA_API_URL}/revision-notes`,
    req.body,
    { headers }
  );
  return reply.send(res.data);
}

// POST /api/teacher/ai/deepseek/revision-notes
async function generateDeepRevision(req, reply) {
  const res = await axios.post(
    `${process.env.DEEPINFRA_API_URL}/deep-revision-notes`,
    req.body,
    { headers }
  );
  return reply.send(res.data);
}

// POST /api/teacher/ai/assignment-enhancements
async function enhanceAssignment(req, reply) {
  const res = await axios.post(
    `${process.env.DEEPINFRA_API_URL}/assignment-enhance`,
    req.body,
    { headers }
  );
  return reply.send(res.data);
}

// POST /api/teacher/ai/quiz-enhancements
async function enhanceQuiz(req, reply) {
  const res = await axios.post(
    `${process.env.DEEPINFRA_API_URL}/quiz-enhance`,
    req.body,
    { headers }
  );
  return reply.send(res.data);
}

// GET /api/teacher/ai/deepseek/suggestions
async function getAISuggestions(req, reply) {
  const res = await axios.get(
    `${process.env.DEEPINFRA_API_URL}/suggestions`,
    { params: req.query, headers }
  );
  return reply.send(res.data);
}

// POST /api/teacher/ai/deepseek/learning-paths
async function createLearningPath(req, reply) {
  const res = await axios.post(
    `${process.env.DEEPINFRA_API_URL}/learning-paths`,
    req.body,
    { headers }
  );
  return reply.send(res.data);
}

module.exports = {
  generatePracticeQuestions,
  generateDeepPractice,
  generateRevisionNotes,
  generateDeepRevision,
  enhanceAssignment,
  enhanceQuiz,
  getAISuggestions,
  createLearningPath
};
