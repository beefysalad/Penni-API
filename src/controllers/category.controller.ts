import type { FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "../errors/app-error.js";
import { AppHelper } from "../helpers/helper.js";
import { categoryService } from "../services/category.services.js";
import type {
  CategoryParams,
  CreateCategoryBody,
  ListCategoriesQuery,
  UpdateCategoryBody,
} from "../schemas/category.schema.js";

function serializeCategory(category: Awaited<ReturnType<typeof categoryService.createCategory>>) {
  return {
    ...category,
    icon: category.icon ?? null,
    colorHex: category.colorHex ?? null,
    clientId: category.clientId ?? null,
    createdAt: AppHelper._serializeDate(category.createdAt),
    updatedAt: AppHelper._serializeDate(category.updatedAt),
    deletedAt: category.deletedAt ? AppHelper._serializeDate(category.deletedAt) : null,
    clientUpdatedAt: category.clientUpdatedAt
      ? AppHelper._serializeDate(category.clientUpdatedAt)
      : null,
  };
}

export const categoryController = {
  listCategories: async (
    request: FastifyRequest,
  ) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const query = request.query as ListCategoriesQuery;

    const categories = await categoryService.listCategories(
      request.auth.clerkUserId,
      query.type,
    );

    return categories.map(serializeCategory);
  },

  createCategory: async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const category = await categoryService.createCategory(
      request.auth.clerkUserId,
      request.body as CreateCategoryBody,
    );

    return reply.status(201).send(serializeCategory(category));
  },

  updateCategory: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const params = request.params as CategoryParams;
    const body = request.body as UpdateCategoryBody;

    const category = await categoryService.updateCategory(
      request.auth.clerkUserId,
      params.id,
      body,
    );

    return serializeCategory(category);
  },

  deleteCategory: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const params = request.params as CategoryParams;

    const category = await categoryService.deleteCategory(
      request.auth.clerkUserId,
      params.id,
    );

    return serializeCategory(category);
  },
};
