import cors from "@fastify/cors";
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

async function corsPluginImpl(app: FastifyInstance) {
  await app.register(cors, {
    origin: env.corsOrigin?.length ? env.corsOrigin : true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "Accept"],
  });
}

export const corsPlugin = fp(corsPluginImpl);
