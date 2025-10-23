// routes/tournament.ts
// routes/tournament.ts
// routes/tournament.ts
// routes/tournament.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/client';

export default async function tournamentRoutes(app: FastifyInstance) {
  // Create tournament
  app.post(
    '/tournament/create',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { name } = req.body as { name: string };
      const user = (req as any).user;

      // Block if any tournament is in status 0 (created) or 1 (started)
      const existing = db
        .prepare('SELECT * FROM tournaments WHERE status IN (0,1)')
        .get();
      if (existing) {
        return reply
          .status(400)
          .send({ error: 'A tournament is already active' });
      }

      const stmt = db.prepare(
        'INSERT INTO tournaments (name, created_by, status) VALUES (?, ?, 0)'
      );
      const result = stmt.run(name, user.username);

      return { success: true, tournamentId: result.lastInsertRowid };
    }
  );

  // Join tournament
  // Join tournament
  app.post(
    '/tournament/join',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      let { alias } = req.body as { alias?: string | null };
      const user = (req as any).user;

      // Default alias to username if null/empty
      if (!alias || alias.trim() === '') {
        alias = user.username;
      }

      // Find tournaments with status = 0
      const tournaments = db
        .prepare('SELECT * FROM tournaments WHERE status = 0')
        .all();

      if (tournaments.length === 0) {
        return reply.status(400).send({ error: 'No joinable tournament' });
      }
      if (tournaments.length > 1) {
        app.log.error('Invariant violation: multiple tournaments with status=0');
        return reply
          .status(500)
          .send({ error: 'Internal error: multiple open tournaments' });
      }

      const tournament = tournaments[0];

      // Alias cannot be an existing username
      const userExists = db
        .prepare('SELECT 1 FROM users WHERE username = ?')
        .get(alias);
      if (userExists) {
        return reply
          .status(400)
          .send({ error: 'Alias cannot be an existing username' });
      }

      try {
        db.prepare(
          'INSERT INTO tournament_players (tournament_id, username, alias) VALUES (?, ?, ?)'
        ).run(tournament.id, user.username, alias);
      } catch (err) {
        return reply
          .status(400)
          .send({ error: 'Already joined or alias taken' });
      }

      return { success: true };
    }
  );

    app.get(
  '/tournament/next-match',
  { preHandler: [app.authenticate] },
  async (req: FastifyRequest, reply: FastifyReply) => {
    // Find the single started tournament
    const tournaments = db
      .prepare('SELECT * FROM tournaments WHERE status = 1')
      .all();

    if (tournaments.length === 0) {
      return reply.status(400).send({ error: 'No started tournament' });
    }
    if (tournaments.length > 1) {
      app.log.error('Invariant violation: multiple tournaments with status=1');
      return reply
        .status(500)
        .send({ error: 'Internal error: multiple started tournaments' });
    }

    const tournament = tournaments[0];

    // Get alive players ordered by wins ascending
    const players = db
      .prepare(
        'SELECT alias, wins FROM tournament_players WHERE tournament_id = ? AND alive != 0 ORDER BY wins ASC, id ASC'
      )
      .all(tournament.id);

    if (players.length === 0) {
      return reply
        .status(500)
        .send({ error: 'No alive players — tournament data corrupted' });
    }

    if (players.length === 1) {
      // Tournament is over → mark as finished
      db.prepare('UPDATE tournaments SET status = 2 WHERE id = ?').run(
        tournament.id
      );

      return { winner: players[0].alias };
    }

    // Pick the two with the fewest wins
    const [p1, p2] = players.slice(0, 2);

    return { player1: p1.alias, player2: p2.alias };
  }
  );

  app.post(
    '/tournament/resolve-match',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { winnerAlias, loserAlias } = req.body as {
        winnerAlias: string;
        loserAlias: string;
      };

      // Find the single started tournament
      const tournaments = db
        .prepare('SELECT * FROM tournaments WHERE status = 1')
        .all();

      if (tournaments.length === 0) {
        return reply.status(400).send({ error: 'No started tournament' });
      }
      if (tournaments.length > 1) {
        app.log.error('Invariant violation: multiple tournaments with status=1');
        return reply
          .status(500)
          .send({ error: 'Internal error: multiple started tournaments' });
      }

      const tournament = tournaments[0];

      // Fetch both players
      const players = db
        .prepare('SELECT id, alias, alive, wins FROM tournament_players WHERE tournament_id = ? AND alias IN (?, ?)')
        .all(tournament.id, winnerAlias, loserAlias) as { id: number; alias: string; alive: number; wins: number }[];

      if (players.length !== 2) {
        return reply
          .status(400)
          .send({ error: 'Both players must exist and be in the tournament' });
      }

      const winner = players.find((p) => p.alias === winnerAlias);
      const loser = players.find((p) => p.alias === loserAlias);

      if (!winner || !loser) {
        return reply.status(400).send({ error: 'Invalid aliases provided' });
      }
      if (winner.alive === 0 || loser.alive === 0) {
        return reply
          .status(400)
          .send({ error: 'Both players must be alive to resolve a match' });
      }

      // Update DB: increment winner wins, mark loser dead
      db.prepare('UPDATE tournament_players SET wins = wins + 1 WHERE id = ?').run(
        winner.id
      );
      db.prepare('UPDATE tournament_players SET alive = 0 WHERE id = ?').run(
        loser.id
      );

      // Placeholder: record result (details TBD)
      recordMatchResult(tournament.id, winner.alias, loser.alias);

      return { success: true, winner: winner.alias, loser: loser.alias };
    }
  );

  // Placeholder function
  function recordMatchResult(
    tournamentId: number,
    winnerAlias: string,
    loserAlias: string
  ) {
    // TODO: implement result recording (e.g. insert into tournament_results table)
    // For now, just log
    console.log(
      `Match result recorded: Tournament ${tournamentId}, Winner=${winnerAlias}, Loser=${loserAlias}`
    );
  }

  // routes/tournament.ts (inside tournamentRoutes)
  app.post(
    '/tournament/start',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      // Find tournaments with status = 0
      const tournaments = db
        .prepare('SELECT * FROM tournaments WHERE status = 0')
        .all();

      if (tournaments.length === 0) {
        return reply.status(400).send({ error: 'No tournament waiting to start' });
      }
      if (tournaments.length > 1) {
        app.log.error('Invariant violation: multiple tournaments with status=0');
        return reply
          .status(500)
          .send({ error: 'Internal error: multiple open tournaments' });
      }

      const tournament = tournaments[0];

      // Count players
      const playerCount = db
        .prepare('SELECT COUNT(*) as count FROM tournament_players WHERE tournament_id = ?')
        .get(tournament.id).count as number;

      // Require power of two and at least 4
      const isPowerOfTwo = playerCount >= 4 && (playerCount & (playerCount - 1)) === 0;
      if (!isPowerOfTwo) {
        return reply.status(400).send({
          error: 'Tournament requires 4, 8, 16, 32, ... players to start'
        });
      }

      // Update status to started
      db.prepare('UPDATE tournaments SET status = 1 WHERE id = ?').run(tournament.id);

      return { success: true, tournamentId: tournament.id };
    }
  );

};
