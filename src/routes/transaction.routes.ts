import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { transactionController } from "../controllers/transaction.controller.js";
import {
  createTransactionRouteSchema,
  deleteTransactionRouteSchema,
  listTransactionsRouteSchema,
  updateTransactionRouteSchema,
} from "../schemas/transaction.schema.js";

export async function transactionRoutes(server: FastifyInstance) {
  const app = server.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/transactions",
    {
      schema: listTransactionsRouteSchema,
      preHandler: app.authenticate,
    },
    transactionController.listTransactions,
  );

  app.post(
    "/transactions",
    {
      schema: createTransactionRouteSchema,
      preHandler: app.authenticate,
    },
    transactionController.createTransaction,
  );

  app.patch(
    "/transactions/:id",
    {
      schema: updateTransactionRouteSchema,
      preHandler: app.authenticate,
    },
    transactionController.updateTransaction,
  );

  app.delete(
    "/transactions/:id",
    {
      schema: deleteTransactionRouteSchema,
      preHandler: app.authenticate,
    },
    transactionController.deleteTransaction,
  );
}
