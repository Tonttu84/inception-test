// srcs/index.ts
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { jwtKey } from './db/client';   
import userRoutes from './routes/user';

const transcendence_server = Fastify({ logger: true });


transcendence_server.register(fastifyJwt, {
  secret: jwtKey,
  sign: { expiresIn: '1h' } 
});


transcendence_server.register(userRoutes);

// Start the server
transcendence_server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    transcendence_server.log.error(err);
    process.exit(1);
  }
  transcendence_server.log.info(`Server listening at ${address}`);
});

export default transcendence_server;
