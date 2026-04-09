import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";

export type CreateDebtInput = {
  userId: string;
  clientId?: string;
  direction: "I_OWE" | "OWED_TO_ME";
  status: "OPEN" | "SETTLED";
  title: string;
  counterpartyName: string;
  notes?: string;
  originalAmount: string;
  currentBalance: string;
  currency: string;
  dueDate?: string;
  clientUpdatedAt?: string;
};

export const debtRepository = {
  listDebtsByUserId: async (userId: string) => {
    return prisma.debt.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: [
        { status: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });
  },

  createDebt: async (input: CreateDebtInput) => {
    return prisma.debt.create({
      data: {
        userId: input.userId,
        direction: input.direction,
        status: input.status,
        title: input.title,
        counterpartyName: input.counterpartyName,
        originalAmount: input.originalAmount,
        currentBalance: input.currentBalance,
        currency: input.currency,
        ...(input.notes ? { notes: input.notes } : {}),
        ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
        ...(input.clientId ? { clientId: input.clientId } : {}),
        ...(input.clientUpdatedAt
          ? { clientUpdatedAt: new Date(input.clientUpdatedAt) }
          : {}),
      },
    });
  },

  getDebtById: async (userId: string, debtId: string) => {
    const debt = await prisma.debt.findFirst({
      where: {
        id: debtId,
        userId,
        deletedAt: null,
      },
    });

    if (!debt) {
      throw new AppError("Debt not found", 404);
    }

    return debt;
  },

  softDeleteDebt: async (userId: string, debtId: string) => {
    await debtRepository.getDebtById(userId, debtId);

    return prisma.debt.update({
      where: {
        id: debtId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  },
};
