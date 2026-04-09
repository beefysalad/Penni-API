import { debtRepository } from "../repository/debt.repository.js";
import type { CreateDebtBody } from "../schemas/debt.schema.js";
import { userService } from "./user.services.js";

export const debtService = {
  listDebts: async (clerkUserId: string) => {
    const user = await userService.ensureCurrentUser(clerkUserId);
    return debtRepository.listDebtsByUserId(user.id);
  },

  createDebt: async (clerkUserId: string, input: CreateDebtBody) => {
    const user = await userService.ensureCurrentUser(clerkUserId);
    const currentBalance = input.currentBalance ?? input.originalAmount;
    const status = Number(currentBalance) <= 0 ? "SETTLED" : "OPEN";

    return debtRepository.createDebt({
      userId: user.id,
      direction: input.direction,
      status,
      title: input.title.trim(),
      counterpartyName: input.counterpartyName.trim(),
      originalAmount: Number(input.originalAmount).toFixed(2),
      currentBalance: Number(currentBalance).toFixed(2),
      currency: input.currency.toUpperCase(),
      ...(input.notes ? { notes: input.notes.trim() } : {}),
      ...(input.dueDate ? { dueDate: input.dueDate } : {}),
      ...(input.clientId ? { clientId: input.clientId } : {}),
      ...(input.clientUpdatedAt ? { clientUpdatedAt: input.clientUpdatedAt } : {}),
    });
  },

  deleteDebt: async (clerkUserId: string, debtId: string) => {
    const user = await userService.ensureCurrentUser(clerkUserId);
    return debtRepository.softDeleteDebt(user.id, debtId);
  },
};
