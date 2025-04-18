// teacherContentRoutes.js
'use strict';

const teacherContentController = require('./teacherContentController');

async function teacherContentRoutes(fastify, options) {
  // --- Assignment Routes ---
  fastify.post('/api/teacher/assignments', teacherContentController.createAssignment);
  fastify.get('/api/teacher/assignments', teacherContentController.listAssignments);
  fastify.get('/api/teacher/assignments/:assignmentId', teacherContentController.getAssignment);
  fastify.put('/api/teacher/assignments/:assignmentId', teacherContentController.updateAssignment);
  fastify.delete('/api/teacher/assignments/:assignmentId', teacherContentController.deleteAssignment);
  fastify.post('/api/teacher/assignments/:assignmentId/duplicate', teacherContentController.duplicateAssignment);

  // AI endpoints for assignment (stubs for now)
  fastify.post('/api/teacher/assignments/ai/generate', teacherContentController.generateAssignmentAI);
  fastify.post('/api/teacher/assignments/ai/preprocess', teacherContentController.preprocessAssignmentAI);
  fastify.get('/api/teacher/assignments/ai/suggestions', teacherContentController.assignmentAISuggestions);

  // --- Resource Routes ---
  fastify.post('/api/teacher/resources', teacherContentController.uploadResource);
  fastify.get('/api/teacher/resources', teacherContentController.listResources);
  fastify.get('/api/teacher/resources/:resourceId', teacherContentController.getResource);
  fastify.put('/api/teacher/resources/:resourceId', teacherContentController.updateResource);
  fastify.delete('/api/teacher/resources/:resourceId', teacherContentController.deleteResource);

  // AI endpoints for resources (stubs for now)
  fastify.post('/api/teacher/resources/ai/generate', teacherContentController.generateResourceAI);
  fastify.post('/api/teacher/resources/ai/preprocess', teacherContentController.preprocessResourceAI);
  fastify.get('/api/teacher/resources/ai/suggestions', teacherContentController.resourceAISuggestions);

  // --- Quiz Routes ---
  fastify.post('/api/teacher/quizzes', teacherContentController.createQuiz);
  fastify.get('/api/teacher/quizzes', teacherContentController.listQuizzes);
  fastify.get('/api/teacher/quizzes/:quizId', teacherContentController.getQuiz);
  fastify.put('/api/teacher/quizzes/:quizId', teacherContentController.updateQuiz);
  fastify.delete('/api/teacher/quizzes/:quizId', teacherContentController.deleteQuiz);

  // AI endpoints for quizzes (stubs for now)
  fastify.post('/api/teacher/quizzes/ai/generate', teacherContentController.generateQuizAI);
  fastify.post('/api/teacher/quizzes/ai/preprocess', teacherContentController.preprocessQuizAI);
  fastify.get('/api/teacher/quizzes/ai/suggestions', teacherContentController.quizAISuggestions);

  fastify.post('/api/teacher/quizzes/:quizId/assign', teacherContentController.assignQuiz);
  fastify.post('/api/teacher/quizzes/:quizId/grade', teacherContentController.gradeQuiz);
}

module.exports = teacherContentRoutes;
