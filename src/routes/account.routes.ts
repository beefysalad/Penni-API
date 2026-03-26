import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { accountController } from "../controllers/account.controller.js";
import {
  createAccountRouteSchema,
  deleteAccountRouteSchema,
  listAccountsRouteSchema,
  updateAccountRouteSchema,
} from "../schemas/account.schema.js";

export async function accountRoutes(server: FastifyInstance) {
  const app = server.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/accounts",
    {
      schema: listAccountsRouteSchema,
      preHandler: app.authenticate,
    },
    accountController.listAccounts,
  );

  app.post(
    "/accounts",
    {
      schema: createAccountRouteSchema,
      preHandler: app.authenticate,
    },
    accountController.createAccount,
  );

  app.patch(
    "/accounts/:id",
    {
      schema: updateAccountRouteSchema,
      preHandler: app.authenticate,
    },
    accountController.updateAccount,
  );

  app.delete(
    "/accounts/:id",
    {
      schema: deleteAccountRouteSchema,
      preHandler: app.authenticate,
    },
    accountController.deleteAccount,
  );
}
