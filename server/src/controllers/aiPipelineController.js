// aiPipelineController.js
'use strict';
const axios = require('axios');

function getHeaders() {
  return { Authorization: `Bearer ${process.env.DEEPINFRA_API_KEY}` };
}

// POST /api/ai/deepinfra/preprocess
async function preprocess(req, reply) {
  const res = await axios.post(
    `${process.env.DEEPINFRA_API_URL}/preprocess`,
    req.body,
    { headers: getHeaders() }
  );
  return reply.send(res.data);
}

// POST /api/ai/deepinfra/generate
async function generate(req, reply) {
  const res = await axios.post(
    `${process.env.DEEPINFRA_API_URL}/generate`,
    req.body,
    { headers: getHeaders() }
  );
  return reply.send(res.data);
}

// GET /api/ai/deepinfra/status
async function status(req, reply) {
  const { jobId } = req.query;
  const res = await axios.get(
    `${process.env.DEEPINFRA_API_URL}/status`,
    { params: { jobId }, headers: getHeaders() }
  );
  return reply.send(res.data);
}

// POST /api/ai/deepinfra/prompts
async function createOrUpdatePrompt(req, reply) {
  const res = await axios.post(
    `${process.env.DEEPINFRA_API_URL}/prompts`,
    req.body,
    { headers: getHeaders() }
  );
  return reply.send(res.data);
}

// GET /api/ai/deepinfra/prompts
async function getPrompts(req, reply) {
  const res = await axios.get(
    `${process.env.DEEPINFRA_API_URL}/prompts`,
    { headers: getHeaders() }
  );
  return reply.send(res.data);
}

// POST /api/ai/deepinfra/batch-generate
async function batchGenerate(req, reply) {
  const res = await axios.post(
    `${process.env.DEEPINFRA_API_URL}/batch-generate`,
    req.body,
    { headers: getHeaders() }
  );
  return reply.send(res.data);
}

// POST /api/ai/deepinfra/feedback
async function feedback(req, reply) {
  const res = await axios.post(
    `${process.env.DEEPINFRA_API_URL}/feedback`,
    req.body,
    { headers: getHeaders() }
  );
  return reply.send(res.data);
}

module.exports = {
  preprocess,
  generate,
  status,
  createOrUpdatePrompt,
  getPrompts,
  batchGenerate,
  feedback
};
