import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { plannedItemController } from "../controllers/planned-item.controller.js";
import {
  createPlannedItemRouteSchema,
  deletePlannedItemRouteSchema,
  listPlannedItemsRouteSchema,
  updatePlannedItemRouteSchema,
} from "../schemas/planned-item.schema.js";

export async function plannedItemRoutes(server: FastifyInstance) {
  const app = server.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/planned-items",
    {
      schema: listPlannedItemsRouteSchema,
      preHandler: app.authenticate,
    },
    plannedItemController.listPlannedItems,
  );

  app.post(
    "/planned-items",
    {
      schema: createPlannedItemRouteSchema,
      preHandler: app.authenticate,
    },
    plannedItemController.createPlannedItem,
  );

  app.patch(
    "/planned-items/:id",
    {
      schema: updatePlannedItemRouteSchema,
      preHandler: app.authenticate,
    },
    plannedItemController.updatePlannedItem,
  );

  app.delete(
    "/planned-items/:id",
    {
      schema: deletePlannedItemRouteSchema,
      preHandler: app.authenticate,
    },
    plannedItemController.deletePlannedItem,
  );
}
