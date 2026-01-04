import { env } from './config/env.js';
import { connectDb } from './db/connect.js';
import { createApp } from './app.js';

async function main() {
  await connectDb();
  const app = createApp();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on :${env.PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


