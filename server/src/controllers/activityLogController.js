// activityLogController.js
'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/teacher/activity-logs
async function getActivityLogs(req, reply) {
  const teacherId = req.userId;
  const logs = await prisma.activityLog.findMany({
    where: { userId: teacherId },
    orderBy: { timestamp: 'desc' }
  });
  return reply.send({ logs });
}

module.exports = { getActivityLogs };
   