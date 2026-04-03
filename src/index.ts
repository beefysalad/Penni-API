import { buildServer } from "./bootstrap.js";
import { env } from "./config/env.js";

const server = buildServer();

const start = async () => {
  try {
    const address = await server.listen({ port: env.port, host: env.host });
    console.log(`Server is running on ${address}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

const shutdown = async (signal: NodeJS.Signals) => {
  try {
    server.log.info(`Received ${signal}. Shutting down gracefully...`);
    await server.close();
    process.exit(0);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

void start();
