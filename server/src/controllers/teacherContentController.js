// teacherContentController.js
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AWS = require('aws-sdk');
const axios = require('axios');

// Configure AWS S3 (ensure your AWS credentials, region, and bucket are set in your environment)
const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * ----------------------------
 * ASSIGNMENT HANDLERS
 * ----------------------------
 */

// Create a new assignment
const createAssignment = async (req, reply) => {
  try {
    const { teacherId, title, description, subject, dueDate } = req.body;
    const assignment = await prisma.assignment.create({
      data: { teacherId, title, description, subject, dueDate: new Date(dueDate) },
    });
    return reply.code(201).send({ message: 'Assignment created', assignment });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error creating assignment' });
  }
};

// List assignments (with optional filters)
const listAssignments = async (req, reply) => {
  try {
    const { teacherId, subject, startDate, endDate } = req.query;
    const filters = { teacherId };

    if (subject) {
      filters.subject = subject;
    }
    if (startDate && endDate) {
      filters.dueDate = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const assignments = await prisma.assignment.findMany({
      where: filters,
      orderBy: { dueDate: 'asc' },
    });
    return reply.send({ assignments });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error fetching assignments' });
  }
};

// Retrieve assignment details by assignmentId
const getAssignment = async (req, reply) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      return reply.code(404).send({ error: 'Assignment not found' });
    }
    return reply.send({ assignment });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving assignment' });
  }
};

// Update an assignment
const updateAssignment = async (req, reply) => {
  try {
    const { assignmentId } = req.params;
    const updatedData = req.body;
    const assignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: updatedData,
    });
    return reply.send({ message: 'Assignment updated', assignment });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error updating assignment' });
  }
};

// Delete an assignment
const deleteAssignment = async (req, reply) => {
  try {
    const { assignmentId } = req.params;
    await prisma.assignment.delete({ where: { id: assignmentId } });
    return reply.send({ message: `Assignment ${assignmentId} deleted` });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error deleting assignment' });
  }
};

// Duplicate an assignment for reuse
const duplicateAssignment = async (req, reply) => {
  try {
    const { assignmentId } = req.params;
    const original = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!original) {
      return reply.code(404).send({ error: 'Original assignment not found' });
    }
    const duplicate = await prisma.assignment.create({
      data: {
        teacherId: original.teacherId,
        title: `${original.title} (Copy)`,
        description: original.description,
        subject: original.subject,
        dueDate: original.dueDate,
      },
    });
    return reply.code(201).send({ message: 'Assignment duplicated', assignment: duplicate });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error duplicating assignment' });
  }
};

/**
 * ----------------------------
 * AI ENDPOINTS FOR ASSIGNMENTS
 * ----------------------------
 */

// Generate assignment content using DeepSeek R1 API
const generateAssignmentAI = async (req, reply) => {
  try {
    const { topic, performanceData } = req.body;
    // Construct a prompt for the AI service
    const prompt = `Generate an assignment for the topic "${topic}" considering performance data: ${JSON.stringify(performanceData)}`;
    const aiResponse = await axios.post(
      `${process.env.DEEPSEEK_API_URL}/generate-assignment`,
      { prompt },
      { headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` } }
    );
    // Assume the AI returns an object with title and description
    const generatedAssignment = { title: aiResponse.data.title, description: aiResponse.data.description };
    return reply.send({ message: 'AI generated assignment', assignment: generatedAssignment });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error generating assignment via AI' });
  }
};

// Preprocess assignment text using DeepSeek R1 API
const preprocessAssignmentAI = async (req, reply) => {
  try {
    const { rawContent } = req.body;
    const aiResponse = await axios.post(
      `${process.env.DEEPSEEK_API_URL}/preprocess-assignment`,
      { rawContent },
      { headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` } }
    );
    const processedContent = aiResponse.data.processedContent;
    return reply.send({ message: 'Assignment content preprocessed', data: { processedContent } });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error preprocessing assignment content via AI' });
  }
};

// Retrieve AI-driven assignment suggestions using DeepSeek R1 API
const assignmentAISuggestions = async (req, reply) => {
  try {
    const { assignmentId } = req.query; // Optionally pass assignmentId or related details
    const aiResponse = await axios.get(
      `${process.env.DEEPSEEK_API_URL}/assignment-suggestions`,
      { params: { assignmentId }, headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` } }
    );
    const suggestions = aiResponse.data.suggestions;
    return reply.send({ suggestions });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving AI suggestions for assignment' });
  }
};

// POST /api/teacher/assignments/:assignmentId/grade
async function gradeAssignment(req, reply) {
  const { assignmentId } = req.params;
  const { studentId, score, feedback } = req.body;
  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    update: { score, feedback },
    create: { assignmentId, studentId, classId: req.body.classId, score, feedback }
  });
  // log action
  await prisma.activityLog.create({
    data: {
      userId: req.userId,
      action: 'GRADE_ASSIGNMENT',
      metadata: { assignmentId, studentId, score }
    }
  });
  return reply.send({ message: 'Assignment graded', submission });
}


/**
 * ----------------------------
 * RESOURCE HANDLERS
 * ----------------------------
 */

// Upload a new resource or short notes (with AWS S3 file upload)
const uploadResource = async (req, reply) => {
  try {
    const data = await req.file();
    const { teacherId, title, subject } = req.body;
    const fileStream = data.file;
    const filename = data.filename;

    const s3Params = {
      Bucket: process.env.S3_BUCKET,
      Key: `resources/${Date.now()}_${filename}`,
      Body: fileStream,
    };

    const s3Response = await s3.upload(s3Params).promise();
    const resource = await prisma.resource.create({
      data: {
        teacherId,
        title,
        subject,
        url: s3Response.Location,
      },
    });
    return reply.code(201).send({ message: 'Resource uploaded', resource });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error uploading resource' });
  }
};

// List teacher resources with optional subject filter
const listResources = async (req, reply) => {
  try {
    const { teacherId, subject } = req.query;
    const filters = { teacherId };
    if (subject) filters.subject = subject;
    const resources = await prisma.resource.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ resources });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error fetching resources' });
  }
};

// Retrieve resource details
const getResource = async (req, reply) => {
  try {
    const { resourceId } = req.params;
    const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
    if (!resource) return reply.code(404).send({ error: 'Resource not found' });
    return reply.send({ resource });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving resource' });
  }
};

// Update resource metadata (not replacing the file)
const updateResource = async (req, reply) => {
  try {
    const { resourceId } = req.params;
    const updatedData = req.body;
    const resource = await prisma.resource.update({
      where: { id: resourceId },
      data: updatedData,
    });
    return reply.send({ message: 'Resource updated', resource });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error updating resource' });
  }
};

// Delete a resource (and optionally remove from S3)
const deleteResource = async (req, reply) => {
  try {
    const { resourceId } = req.params;
    const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
    if (!resource) return reply.code(404).send({ error: 'Resource not found' });
    // Optionally, add logic to remove file from S3 using the URL or S3 key.
    await prisma.resource.delete({ where: { id: resourceId } });
    return reply.send({ message: `Resource ${resourceId} deleted` });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error deleting resource' });
  }
};

/**
 * AI ENDPOINTS FOR RESOURCES
 */

// Generate study material using DeepSeek R1 API
const generateResourceAI = async (req, reply) => {
  try {
    const { contentOutline, topic } = req.body;
    const prompt = `Generate study material for the topic "${topic}" with the outline: ${contentOutline}`;
    const aiResponse = await axios.post(
      `${process.env.DEEPSEEK_API_URL}/generate-resource`,
      { prompt },
      { headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` } }
    );
    const generatedResource = { title: aiResponse.data.title, content: aiResponse.data.content };
    return reply.send({ message: 'AI generated resource', resource: generatedResource });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error generating resource via AI' });
  }
};

// Preprocess uploaded resource content for tagging/topic extraction
const preprocessResourceAI = async (req, reply) => {
  try {
    const { rawContent } = req.body;
    const aiResponse = await axios.post(
      `${process.env.DEEPSEEK_API_URL}/preprocess-resource`,
      { rawContent },
      { headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` } }
    );
    const processed = { processedContent: aiResponse.data.processedContent };
    return reply.send({ message: 'Resource content preprocessed', data: processed });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error preprocessing resource content via AI' });
  }
};

// Retrieve AI-enhanced recommendations for resource improvements via DeepSeek R1 API
const resourceAISuggestions = async (req, reply) => {
  try {
    const { resourceId } = req.query; // Optionally pass resource details
    const aiResponse = await axios.get(
      `${process.env.DEEPSEEK_API_URL}/resource-suggestions`,
      { params: { resourceId }, headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` } }
    );
    const suggestions = aiResponse.data.suggestions;
    return reply.send({ suggestions });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving AI suggestions for resource' });
  }
};

/**
 * ----------------------------
 * QUIZ HANDLERS
 * ----------------------------
 */

// Create a new quiz
const createQuiz = async (req, reply) => {
  try {
    const { teacherId, title, subject, timeLimit, questions } = req.body;
    const quiz = await prisma.quiz.create({
      data: { teacherId, title, subject, timeLimit, questions },
    });
    return reply.code(201).send({ message: 'Quiz created', quiz });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error creating quiz' });
  }
};

// List all quizzes for a teacher
const listQuizzes = async (req, reply) => {
  try {
    const { teacherId, subject } = req.query;
    const filters = { teacherId };
    if (subject) filters.subject = subject;
    const quizzes = await prisma.quiz.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ quizzes });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error fetching quizzes' });
  }
};

// Retrieve quiz details
const getQuiz = async (req, reply) => {
  try {
    const { quizId } = req.params;
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) return reply.code(404).send({ error: 'Quiz not found' });
    return reply.send({ quiz });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving quiz' });
  }
};

// Update a quiz
const updateQuiz = async (req, reply) => {
  try {
    const { quizId } = req.params;
    const updatedData = req.body;
    const quiz = await prisma.quiz.update({ where: { id: quizId }, data: updatedData });
    return reply.send({ message: 'Quiz updated', quiz });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error updating quiz' });
  }
};

// Delete a quiz
const deleteQuiz = async (req, reply) => {
  try {
    const { quizId } = req.params;
    await prisma.quiz.delete({ where: { id: quizId } });
    return reply.send({ message: `Quiz ${quizId} deleted` });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error deleting quiz' });
  }
};

/**
 * AI ENDPOINTS FOR QUIZZES
 */

// Generate quiz questions using DeepSeek R1 API
const generateQuizAI = async (req, reply) => {
  try {
    const { topic, difficulty, performanceData } = req.body;
    const prompt = `Generate quiz questions for the topic "${topic}" with difficulty "${difficulty}" considering performance data: ${JSON.stringify(performanceData)}`;
    const aiResponse = await axios.post(
      `${process.env.DEEPSEEK_API_URL}/generate-quiz`,
      { prompt },
      { headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` } }
    );
    const generatedQuiz = { title: aiResponse.data.title, questions: aiResponse.data.questions };
    return reply.send({ message: 'AI generated quiz', quiz: generatedQuiz });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error generating quiz via AI' });
  }
};

// Preprocess quiz content for AI integration using DeepSeek R1 API
const preprocessQuizAI = async (req, reply) => {
  try {
    const { rawQuizContent } = req.body;
    const aiResponse = await axios.post(
      `${process.env.DEEPSEEK_API_URL}/preprocess-quiz`,
      { rawQuizContent },
      { headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` } }
    );
    const processed = { processedContent: aiResponse.data.processedContent };
    return reply.send({ message: 'Quiz content preprocessed', data: processed });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error preprocessing quiz content via AI' });
  }
};

// Retrieve AI-based suggestions for quiz improvement via DeepSeek R1 API
const quizAISuggestions = async (req, reply) => {
  try {
    const { quizId } = req.query; // Optionally pass quizId or related details
    const aiResponse = await axios.get(
      `${process.env.DEEPSEEK_API_URL}/quiz-suggestions`,
      { params: { quizId }, headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` } }
    );
    const suggestions = aiResponse.data.suggestions;
    return reply.send({ suggestions });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving AI suggestions for quiz' });
  }
};

// Assign a quiz to a class or selected students (business logic remains local)
const assignQuiz = async (req, reply) => {
  try {
    const { quizId } = req.params;
    const { classId, studentIds } = req.body;
    // TODO: Implement detailed assignment logic; here we simply acknowledge the assignment.
    return reply.send({ message: `Quiz ${quizId} assigned to class ${classId}`, studentIds });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error assigning quiz' });
  }
};

// Submit or update quiz grades (business logic remains local)
const gradeQuiz = async (req, reply) => {
  try {
    const { quizId } = req.params;
    const { grades } = req.body; // Expecting an object mapping studentId to grade
    // TODO: Implement updating of quiz grades in the database.
    return reply.send({ message: `Quiz ${quizId} grades updated`, grades });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error updating quiz grades' });
  }
};

module.exports = {
  // Assignment Handlers
  createAssignment,
  listAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  duplicateAssignment,
  generateAssignmentAI,
  preprocessAssignmentAI,
  assignmentAISuggestions,
  gradeAssignment,

  // Resource Handlers
  uploadResource,
  listResources,
  getResource,
  updateResource,
  deleteResource,
  generateResourceAI,
  preprocessResourceAI,
  resourceAISuggestions,

  // Quiz Handlers
  createQuiz,
  listQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  generateQuizAI,
  preprocessQuizAI,
  quizAISuggestions,
  assignQuiz,
  gradeQuiz,
};
