import { budgetRepository } from "../repository/budget.repository.js";
import type {
  CreateBudgetBody,
  UpdateBudgetBody,
} from "../schemas/budget.schema.js";
import { userService } from "./user.services.js";

export const budgetService = {
  listBudgets: async (clerkUserId: string) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return budgetRepository.listBudgetsByUserId(user.id);
  },

  createBudget: async (
    clerkUserId: string,
    input: CreateBudgetBody,
  ) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return budgetRepository.createBudget({
      userId: user.id,
      amount: input.amount,
      currency: input.currency,
      alertThreshold: input.alertThreshold ?? 80,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      ...(input.clientId ? { clientId: input.clientId } : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.name ? { name: input.name } : {}),
      ...(input.clientUpdatedAt
        ? { clientUpdatedAt: input.clientUpdatedAt }
        : {}),
    });
  },

  updateBudget: async (
    clerkUserId: string,
    budgetId: string,
    input: UpdateBudgetBody,
  ) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return budgetRepository.updateBudget(user.id, budgetId, {
      ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.alertThreshold !== undefined
        ? { alertThreshold: input.alertThreshold }
        : {}),
      ...(input.periodStart !== undefined
        ? { periodStart: input.periodStart }
        : {}),
      ...(input.periodEnd !== undefined
        ? { periodEnd: input.periodEnd }
        : {}),
      ...(input.clientUpdatedAt !== undefined
        ? { clientUpdatedAt: input.clientUpdatedAt }
        : {}),
    });
  },

  deleteBudget: async (clerkUserId: string, budgetId: string) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return budgetRepository.softDeleteBudget(user.id, budgetId);
  },
};
