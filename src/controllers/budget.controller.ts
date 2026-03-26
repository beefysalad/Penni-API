import type { FastifyReply, FastifyRequest } from "fastify";
import { AppHelper } from "../helpers/helper.js";
import { AppError } from "../errors/app-error.js";
import { budgetService } from "../services/budget.services.js";
import type {
  BudgetParams,
  CreateBudgetBody,
  UpdateBudgetBody,
} from "../schemas/budget.schema.js";

function serializeBudget(budget: Awaited<ReturnType<typeof budgetService.createBudget>>) {
  return {
    ...budget,
    amount: budget.amount.toString(),
    periodStart: AppHelper._serializeDate(budget.periodStart),
    periodEnd: AppHelper._serializeDate(budget.periodEnd),
    createdAt: AppHelper._serializeDate(budget.createdAt),
    updatedAt: AppHelper._serializeDate(budget.updatedAt),
    deletedAt: budget.deletedAt ? AppHelper._serializeDate(budget.deletedAt) : null,
    clientUpdatedAt: budget.clientUpdatedAt
      ? AppHelper._serializeDate(budget.clientUpdatedAt)
      : null,
    clientId: budget.clientId ?? null,
    categoryId: budget.categoryId ?? null,
    name: budget.name ?? null,
  };
}

export const budgetController = {
  listBudgets: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const budgets = await budgetService.listBudgets(request.auth.clerkUserId);

    return budgets.map(serializeBudget);
  },

  createBudget: async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const budget = await budgetService.createBudget(
      request.auth.clerkUserId,
      request.body as CreateBudgetBody,
    );

    return reply.status(201).send(serializeBudget(budget));
  },

  updateBudget: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const params = request.params as BudgetParams;
    const body = request.body as UpdateBudgetBody;

    const budget = await budgetService.updateBudget(
      request.auth.clerkUserId,
      params.id,
      body,
    );

    return serializeBudget(budget);
  },

  deleteBudget: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const params = request.params as BudgetParams;

    const budget = await budgetService.deleteBudget(
      request.auth.clerkUserId,
      params.id,
    );

    return serializeBudget(budget);
  },
};
