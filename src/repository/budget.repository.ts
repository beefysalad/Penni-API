import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";

export type CreateBudgetInput = {
  userId: string;
  clientId?: string;
  categoryId?: string;
  name?: string;
  amount: string;
  currency: string;
  alertThreshold: number;
  periodStart: string;
  periodEnd: string;
  clientUpdatedAt?: string;
};

export type UpdateBudgetInput = Partial<Omit<CreateBudgetInput, "userId">>;

export const budgetRepository = {
  listBudgetsByUserId: async (userId: string) => {
    return prisma.budget.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        periodStart: "desc",
      },
    });
  },

  createBudget: async (input: CreateBudgetInput) => {
    return prisma.budget.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        currency: input.currency,
        alertThreshold: input.alertThreshold,
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        ...(input.clientId ? { clientId: input.clientId } : {}),
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
        ...(input.name ? { name: input.name } : {}),
        ...(input.clientUpdatedAt
          ? { clientUpdatedAt: new Date(input.clientUpdatedAt) }
          : {}),
      },
    });
  },

  getBudgetById: async (userId: string, budgetId: string) => {
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId,
        deletedAt: null,
      },
    });

    if (!budget) {
      throw new AppError("Budget not found", 404);
    }

    return budget;
  },

  updateBudget: async (userId: string, budgetId: string, input: UpdateBudgetInput) => {
    await budgetRepository.getBudgetById(userId, budgetId);

    return prisma.budget.update({
      where: {
        id: budgetId,
      },
      data: {
        ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.alertThreshold !== undefined
          ? { alertThreshold: input.alertThreshold }
          : {}),
        ...(input.periodStart !== undefined
          ? { periodStart: new Date(input.periodStart) }
          : {}),
        ...(input.periodEnd !== undefined
          ? { periodEnd: new Date(input.periodEnd) }
          : {}),
        ...(input.clientUpdatedAt !== undefined
          ? { clientUpdatedAt: new Date(input.clientUpdatedAt) }
          : {}),
      },
    });
  },

  softDeleteBudget: async (userId: string, budgetId: string) => {
    await budgetRepository.getBudgetById(userId, budgetId);

    return prisma.budget.update({
      where: {
        id: budgetId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  },
};
