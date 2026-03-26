import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { meRouteSchema } from "../schemas/user.schema.js";
import { userController } from "../controllers/user.controller.js";

export async function userRoutes(server: FastifyInstance) {
  const app = server.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/me",
    {
      schema: meRouteSchema,
      preHandler: app.authenticate,
    },
    userController.me,
  );
}
