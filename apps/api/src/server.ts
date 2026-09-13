import { env } from "./config/env";
import { createApp } from "./app";
import { connectToDatabase } from "./db/connection";

async function main(): Promise<void> {
  await connectToDatabase();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`PrepSync API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
