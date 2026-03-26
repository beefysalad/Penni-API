import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { jsonSchemaTransform } from "fastify-type-provider-zod";
import { env } from "../config/env.js";

async function swaggerPluginImpl(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: env.appName,
        version: "1.0.0",
        description: "Backend API for Penni",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUI, { routePrefix: "/api/docs" });
}

export const swaggerPlugin = fp(swaggerPluginImpl);
