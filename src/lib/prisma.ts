import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const connectionString = env.databaseUrl;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

if (env.nodeEnv !== "production") {
  globalThis.__prisma = prismaClient;
}

export const prisma = prismaClient;
