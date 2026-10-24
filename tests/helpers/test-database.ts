import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const MIGRATION_FILE = resolve(
  process.cwd(),
  'prisma/migrations/20261023130000_init/migration.sql',
);

export interface TestDatabase {
  url: string;
  close: () => Promise<void>;
}

function getFreePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolvePort(port));
    });
  });
}

export async function startTestDatabase(): Promise<TestDatabase> {
  const database = await PGlite.create();
  await database.exec(readFileSync(MIGRATION_FILE, 'utf8'));

  const port = await getFreePort();
  const server = new PGLiteSocketServer({
    db: database,
    host: '127.0.0.1',
    port,
    maxConnections: 10,
  });

  await server.start();

  return {
    url: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?schema=public&connection_limit=2`,
    close: async () => {
      await server.stop();
      await database.close();
    },
  };
}
