import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { budgetController } from "../controllers/budget.controller.js";
import {
  createBudgetRouteSchema,
  deleteBudgetRouteSchema,
  listBudgetsRouteSchema,
  updateBudgetRouteSchema,
} from "../schemas/budget.schema.js";

export async function budgetRoutes(server: FastifyInstance) {
  const app = server.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/budgets",
    {
      schema: listBudgetsRouteSchema,
      preHandler: app.authenticate,
    },
    budgetController.listBudgets,
  );

  app.post(
    "/budgets",
    {
      schema: createBudgetRouteSchema,
      preHandler: app.authenticate,
    },
    budgetController.createBudget,
  );

  app.patch(
    "/budgets/:id",
    {
      schema: updateBudgetRouteSchema,
      preHandler: app.authenticate,
    },
    budgetController.updateBudget,
  );

  app.delete(
    "/budgets/:id",
    {
      schema: deleteBudgetRouteSchema,
      preHandler: app.authenticate,
    },
    budgetController.deleteBudget,
  );
}
