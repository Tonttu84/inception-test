import { FastifyInstance } from 'fastify';
import { createUser, logInUser } from '../services/userService';



//Backend never gets the unhashed password so we can only test if it looks like a valid hash
function looksLikeBcrypt(hash: string): boolean {
  // Regex: start with $2a$, $2b$, or $2y$, then 2 digits (cost), then 53 chars of salt+hash
  const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
  return bcryptRegex.test(hash);
}


//Thiis tries to create a new user
export default async function userRoutes(fastify: FastifyInstance) {
  fastify.post('/users', async (request, reply) => {
    const { username, password } = request.body as {
      username: string;
      password: string; // already hashed
    };


    if (!username || !password) {
      return reply.status(400).send({ error: 'Missing username or password' });
    }

    if (!looksLikeBcrypt(password)) {
    return reply.status(400).send({ error: 'Password is not a bcrypt hash' });
    }

    try {
      createUser(username, password);
      reply.status(201).send({ message: 'User created' });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return reply.status(409).send({ error: 'Username already exists' });
      }
      fastify.log.error(err);
      reply.status(500).send({ error: 'Failed to create user' });
    }
  });

  //login function that returns the JWT token on success 
  fastify.post('/auth/login', async (request, reply) => {
    const { username, password } = request.body as {
      username: string;
      password: string; //a lready hashed by frontend
    };

    const user = logInUser(username, password);
    if (!user) {
      return reply.status(401).send({ error: 'Invalid username or password' });
    }

    // Sign a JWT with user info
      const token = fastify.jwt.sign({
        sub: user.id,
        username: user.username
      });

    return { token };
     });
}
