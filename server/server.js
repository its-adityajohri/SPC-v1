require('dotenv').config();
const fastify = require('fastify')({ logger: true });

// Register cookie and JWT plugins
fastify.register(require('@fastify/cookie'));
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET,
});

// Global authentication decorator
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// Register Prisma plugin
fastify.register(require('./plugins/prismaPlugin'));

// Register Auth routes
fastify.register(require('./src/routes/authRoutes'), { prefix: '/api/auth' });

// Register Mail routes
fastify.register(require('./src/routes/mailRoutes'), { prefix: '/api/mail' });

// (Register additional routes as needed)

// Health check route
fastify.get('/', async (request, reply) => {
  return {
    status: 'healthy',
    message: 'Hello World!',
    timestamp: new Date().toISOString()
  };
});


const start = async () => {
  try {
    await fastify.listen({ 
      port: process.env.PORT || 3000,
      host: 'localhost'
    });
    fastify.log.info(`Server running on http://localhost:${process.env.PORT || 3000}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
