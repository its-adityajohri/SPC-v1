const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function prismaPlugin(fastify, options) {
  // Decorate fastify with prisma
  fastify.decorate('prisma', prisma);

  // Add a hook to close the Prisma connection when the server stops
  fastify.addHook('onClose', async (instance) => {
    await prisma.$disconnect();
  });
}

module.exports = prismaPlugin; 