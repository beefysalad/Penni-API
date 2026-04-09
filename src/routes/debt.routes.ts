import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { debtController } from "../controllers/debt.controller.js";
import {
  createDebtRouteSchema,
  deleteDebtRouteSchema,
  listDebtsRouteSchema,
} from "../schemas/debt.schema.js";

export async function debtRoutes(server: FastifyInstance) {
  const app = server.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/debts",
    {
      schema: listDebtsRouteSchema,
      preHandler: app.authenticate,
    },
    debtController.listDebts,
  );

  app.post(
    "/debts",
    {
      schema: createDebtRouteSchema,
      preHandler: app.authenticate,
    },
    debtController.createDebt,
  );

  app.delete(
    "/debts/:id",
    {
      schema: deleteDebtRouteSchema,
      preHandler: app.authenticate,
    },
    debtController.deleteDebt,
  );
}
