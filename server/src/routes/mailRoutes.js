const mailService = require('../services/mailService');

async function mailRoutes(fastify, options) {
    // Email sending endpoint
    fastify.post('/send-email', {
        schema: {
            body: {
                type: 'object',
                required: ['to', 'subject'],
                properties: {
                    to: { type: 'string', format: 'email' },
                    subject: { type: 'string' },
                    text: { type: 'string' },
                    html: { type: 'string' }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const result = await mailService.sendEmail(request.body);
                return result;
            } catch (error) {
                reply.status(500).send({
                    success: false,
                    message: 'Failed to send email',
                    error: error.message
                });
            }
        }
    });

    // Health check endpoint
    fastify.get('/health', {
        handler: async (request, reply) => {
            try {
                return await mailService.checkHealth();
            } catch (error) {
                reply.status(500).send({
                    success: false,
                    message: 'Health check failed',
                    error: error.message
                });
            }
        }
    });
}

module.exports = mailRoutes; 