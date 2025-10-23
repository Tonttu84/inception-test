// srcs/index.ts
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { jwtKey } from './db/client';
import { initSchema } from './db/schema';
import userRoutes from './routes/user';
import tournamentRoutes from './routes/tournament';

const app = Fastify({ logger: true });

// Initialize schema once at startup
initSchema();

app.register(fastifyJwt, {
  secret: jwtKey,
  sign: { expiresIn: '1h' }
});

app.register(userRoutes);
app.register(tournamentRoutes);

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});

export default app;
