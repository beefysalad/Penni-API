import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { feedbackController } from "../controllers/feedback.controller.js";
import {
  createFeedbackRouteSchema,
  listFeedbackRouteSchema,
} from "../schemas/feedback.schema.js";

export async function feedbackRoutes(server: FastifyInstance) {
  const app = server.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/feedback",
    {
      schema: listFeedbackRouteSchema,
      preHandler: app.authenticate,
    },
    feedbackController.listFeedback,
  );

  app.post(
    "/feedback",
    {
      schema: createFeedbackRouteSchema,
      preHandler: app.authenticate,
    },
    feedbackController.createFeedback,
  );
}
