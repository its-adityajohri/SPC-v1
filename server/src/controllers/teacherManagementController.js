// teacherManagementController.js
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

// ***********************************************
// Attendance Management Endpoints
// ***********************************************

/**
 * Create or update daily attendance for a class.
 * Expecting a payload that includes teacherId, classId, date, and an array of records.
 * Each record: { studentId: string, status: 'present' | 'absent' | 'late' }
 */
const createOrUpdateAttendance = async (req, reply) => {
  try {
    const { teacherId, classId, date, records } = req.body;
    // We assume a composite key on (classId, date) for a given teacher.
    // First, check if an attendance record exists for this class & date.
    let attendance = await prisma.attendance.findFirst({
      where: { teacherId, classId, date: new Date(date) },
    });
    if (attendance) {
      // Update existing attendance record (we assume records is a JSON field)
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { records },
      });
      return reply.send({ message: 'Attendance updated', attendance });
    } else {
      // Create new attendance record
      attendance = await prisma.attendance.create({
        data: { teacherId, classId, date: new Date(date), records },
      });
      return reply.code(201).send({ message: 'Attendance created', attendance });
    }
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error recording attendance' });
  }
};

/**
 * Retrieve attendance records for a given teacher/class/date.
 * Query parameters may include teacherId, classId, and an optional date range.
 */
const getAttendance = async (req, reply) => {
  try {
    const { teacherId, classId, startDate, endDate } = req.query;
    const filters = { teacherId, classId };
    if (startDate && endDate) {
      filters.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    const attendances = await prisma.attendance.findMany({
      where: filters,
      orderBy: { date: 'asc' },
    });
    return reply.send({ attendances });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving attendance records' });
  }
};

// ***********************************************
// Performance Analytics (Basic Calculations)
// ***********************************************

/**
 * Get overall class performance overview analytics.
 * Returns aggregated data (e.g., average scores) for a given class over a selected date range.
 */
const getClassOverviewAnalytics = async (req, reply) => {
  try {
    const { classId, startDate, endDate } = req.query;
    // For demonstration, we assume student records store overall marks.
    // In production, you might use aggregation queries.
    const records = await prisma.studentRecord.findMany({
      where: {
        classId,
        updatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });
    // Calculate average score (assuming each record has a field "overallScore")
    const total = records.reduce((sum, rec) => sum + (rec.overallScore || 0), 0);
    const avgScore = records.length > 0 ? total / records.length : 0;
    return reply.send({ classId, averageScore: avgScore, totalRecords: records.length });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving class overview analytics' });
  }
};

/**
 * Get performance analytics for a specific assignment at the class level.
 * Returns aggregated scores and distribution details.
 */
const getClassAssignmentAnalytics = async (req, reply) => {
  try {
    const { assignmentId, classId } = req.query;
    // Assumes there is a table of assignment submissions associated with student records.
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId, classId },
    });
    const totalScore = submissions.reduce((sum, submission) => sum + (submission.score || 0), 0);
    const averageScore = submissions.length > 0 ? totalScore / submissions.length : 0;
    return reply.send({ assignmentId, classId, averageScore, totalSubmissions: submissions.length, submissions });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving class assignment analytics' });
  }
};

/**
 * Get performance analytics for a specific quiz at the class level.
 */
const getClassQuizAnalytics = async (req, reply) => {
  try {
    const { quizId, classId } = req.query;
    const submissions = await prisma.quizSubmission.findMany({
      where: { quizId, classId },
    });
    const totalScore = submissions.reduce((sum, submission) => sum + (submission.score || 0), 0);
    const averageScore = submissions.length > 0 ? totalScore / submissions.length : 0;
    return reply.send({ quizId, classId, averageScore, totalSubmissions: submissions.length, submissions });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving class quiz analytics' });
  }
};

/**
 * Get overall performance analytics for an individual student over a time period.
 */
const getIndividualOverviewAnalytics = async (req, reply) => {
  try {
    const { studentId, startDate, endDate } = req.query;
    const records = await prisma.studentRecord.findMany({
      where: {
        studentId,
        updatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });
    // For example, calculate average overall score
    const total = records.reduce((sum, rec) => sum + (rec.overallScore || 0), 0);
    const avgScore = records.length > 0 ? total / records.length : 0;
    return reply.send({ studentId, averageScore: avgScore, totalRecords: records.length });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving individual overview analytics' });
  }
};

/**
 * Get individual performance analytics for a specific assignment.
 */
const getIndividualAssignmentAnalytics = async (req, reply) => {
  try {
    const { assignmentId, studentId } = req.query;
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });
    if (!submission) {
      return reply.code(404).send({ error: 'Assignment submission not found for the student' });
    }
    return reply.send({ submission });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving individual assignment analytics' });
  }
};

/**
 * Get individual performance analytics for a specific quiz.
 */
const getIndividualQuizAnalytics = async (req, reply) => {
  try {
    const { quizId, studentId } = req.query;
    const submission = await prisma.quizSubmission.findUnique({
      where: { quizId_studentId: { quizId, studentId } },
    });
    if (!submission) {
      return reply.code(404).send({ error: 'Quiz submission not found for the student' });
    }
    return reply.send({ submission });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving individual quiz analytics' });
  }
};

// ***********************************************
// AI-DRIVEN DEEP INSIGHTS (Using DeepInfra API Integration)
// ***********************************************

/**
 * Get deep analytics for class overview using AI.
 */
const getDeepInsightsClassOverview = async (req, reply) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const payload = { classId, startDate, endDate };
    const aiResponse = await axios.post(
      `${process.env.DEEPINFRA_API_URL}/deep-insights/class-overview`,
      payload,
      { headers: { 'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}` } }
    );
    return reply.send({ data: aiResponse.data });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving deep class insights' });
  }
};

/**
 * Get deep analytics for individual student overview using AI.
 */
const getDeepInsightsIndividualOverview = async (req, reply) => {
  try {
    const { studentId, startDate, endDate } = req.query;
    const payload = { studentId, startDate, endDate };
    const aiResponse = await axios.post(
      `${process.env.DEEPINFRA_API_URL}/deep-insights/individual-overview`,
      payload,
      { headers: { 'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}` } }
    );
    return reply.send({ data: aiResponse.data });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving deep individual insights' });
  }
};

/**
 * Get deep insights for a specific assignment.
 */
const getDeepInsightsAssignment = async (req, reply) => {
  try {
    const { assignmentId, classId } = req.query;
    const payload = { assignmentId, classId };
    const aiResponse = await axios.post(
      `${process.env.DEEPINFRA_API_URL}/deep-insights/assignment`,
      payload,
      { headers: { 'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}` } }
    );
    return reply.send({ data: aiResponse.data });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving deep assignment insights' });
  }
};

/**
 * Get deep insights for a specific quiz.
 */
const getDeepInsightsQuiz = async (req, reply) => {
  try {
    const { quizId, classId } = req.query;
    const payload = { quizId, classId };
    const aiResponse = await axios.post(
      `${process.env.DEEPINFRA_API_URL}/deep-insights/quiz`,
      payload,
      { headers: { 'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}` } }
    );
    return reply.send({ data: aiResponse.data });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving deep quiz insights' });
  }
};

/**
 * Submit an ad-hoc query to the AI pipeline for custom performance insights.
 */
const postDeepInsightsQuery = async (req, reply) => {
  try {
    const { queryText, context } = req.body;
    const payload = { queryText, context };
    const aiResponse = await axios.post(
      `${process.env.DEEPINFRA_API_URL}/deep-insights/query`,
      payload,
      { headers: { 'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}` } }
    );
    return reply.send({ data: aiResponse.data });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error processing deep insights query' });
  }
};

/**
 * Retrieve trend analysis data using AI.
 */
const getDeepInsightsTrends = async (req, reply) => {
  try {
    // You might pass subject or date range as query parameters.
    const { subject, startDate, endDate } = req.query;
    const payload = { subject, startDate, endDate };
    const aiResponse = await axios.post(
      `${process.env.DEEPINFRA_API_URL}/deep-insights/trends`,
      payload,
      { headers: { 'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}` } }
    );
    return reply.send({ data: aiResponse.data });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving deep insights trends' });
  }
};

/**
 * Retrieve raw deep analytics data for further custom analysis.
 */
const getDeepInsightsData = async (req, reply) => {
  try {
    const { dataId, filters } = req.query;
    // Depending on your API structure, filters may need to be parsed.
    const aiResponse = await axios.get(
      `${process.env.DEEPINFRA_API_URL}/deep-insights/data`,
      { params: { dataId, filters }, headers: { 'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}` } }
    );
    return reply.send({ data: aiResponse.data });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving deep analytics data' });
  }
};

// ***********************************************
// Student Academic Record Management
// ***********************************************

/**
 * List all student academic records for a teacher (optionally filtered by class or subject).
 */
const listStudentRecords = async (req, reply) => {
  try {
    const { teacherId, classId, subject } = req.query;
    const filters = { teacherId };
    if (classId) filters.classId = classId;
    if (subject) filters.subject = subject;
    const records = await prisma.studentRecord.findMany({
      where: filters,
      orderBy: { updatedAt: 'desc' },
    });
    return reply.send({ records });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error fetching student records' });
  }
};

/**
 * Retrieve a specific student's academic record.
 */
const getStudentRecord = async (req, reply) => {
  try {
    const { studentId } = req.params;
    const record = await prisma.studentRecord.findUnique({ where: { studentId } });
    if (!record) return reply.code(404).send({ error: 'Student record not found' });
    return reply.send({ record });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error retrieving student record' });
  }
};

/**
 * Update a student's academic record with new data or remarks.
 */
const updateStudentRecord = async (req, reply) => {
  try {
    const { studentId } = req.params;
    const updatedData = req.body;
    const record = await prisma.studentRecord.update({
      where: { studentId },
      data: updatedData,
    });
    return reply.send({ message: 'Student record updated', record });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ error: 'Error updating student record' });
  }
};

module.exports = {
  // Attendance Endpoints
  createOrUpdateAttendance,
  getAttendance,

  // Performance Analytics (Basic)
  getClassOverviewAnalytics,
  getClassAssignmentAnalytics,
  getClassQuizAnalytics,
  getIndividualOverviewAnalytics,
  getIndividualAssignmentAnalytics,
  getIndividualQuizAnalytics,

  // Deep Insights (AI-driven)
  getDeepInsightsClassOverview,
  getDeepInsightsIndividualOverview,
  getDeepInsightsAssignment,
  getDeepInsightsQuiz,
  postDeepInsightsQuery,
  getDeepInsightsTrends,
  getDeepInsightsData,

  // Student Academic Record Management
  listStudentRecords,
  getStudentRecord,
  updateStudentRecord,
};
