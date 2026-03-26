import type { FastifyInstance } from "fastify";
import { AppError } from "../errors/app-error.js";

export async function errorHandlerPlugin(app: FastifyInstance) {
  app.setErrorHandler((error: unknown, _request, reply) => {
    const err = error as { validation?: unknown };

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          message: error.message,
        },
      });
    }

    if (err.validation) {
      return reply.status(400).send({
        error: {
          message: "Validation error",
          details: err.validation,
        },
      });
    }

    return reply.status(500).send({
      error: {
        message: "Internal Server Error",
      },
    });
  });
}
