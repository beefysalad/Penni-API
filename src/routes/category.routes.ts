import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { categoryController } from "../controllers/category.controller.js";
import {
  createCategoryRouteSchema,
  deleteCategoryRouteSchema,
  listCategoriesRouteSchema,
  updateCategoryRouteSchema,
} from "../schemas/category.schema.js";

export async function categoryRoutes(server: FastifyInstance) {
  const app = server.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/categories",
    {
      schema: listCategoriesRouteSchema,
      preHandler: app.authenticate,
    },
    categoryController.listCategories,
  );

  app.post(
    "/categories",
    {
      schema: createCategoryRouteSchema,
      preHandler: app.authenticate,
    },
    categoryController.createCategory,
  );

  app.patch(
    "/categories/:id",
    {
      schema: updateCategoryRouteSchema,
      preHandler: app.authenticate,
    },
    categoryController.updateCategory,
  );

  app.delete(
    "/categories/:id",
    {
      schema: deleteCategoryRouteSchema,
      preHandler: app.authenticate,
    },
    categoryController.deleteCategory,
  );
}
