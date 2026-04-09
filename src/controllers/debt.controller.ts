import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors/app-error.js";
import { AppHelper } from "../helpers/helper.js";
import type { DebtParams, CreateDebtBody } from "../schemas/debt.schema.js";
import { debtService } from "../services/debt.services.js";

function serializeDebt(debt: Awaited<ReturnType<typeof debtService.createDebt>>) {
  return {
    ...debt,
    clientId: debt.clientId ?? null,
    notes: debt.notes ?? null,
    originalAmount: debt.originalAmount.toString(),
    currentBalance: debt.currentBalance.toString(),
    dueDate: debt.dueDate ? AppHelper._serializeDate(debt.dueDate) : null,
    createdAt: AppHelper._serializeDate(debt.createdAt),
    updatedAt: AppHelper._serializeDate(debt.updatedAt),
    deletedAt: debt.deletedAt ? AppHelper._serializeDate(debt.deletedAt) : null,
    clientUpdatedAt: debt.clientUpdatedAt
      ? AppHelper._serializeDate(debt.clientUpdatedAt)
      : null,
  };
}

export const debtController = {
  listDebts: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const debts = await debtService.listDebts(request.auth.clerkUserId);
    return debts.map(serializeDebt);
  },

  createDebt: async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const debt = await debtService.createDebt(
      request.auth.clerkUserId,
      request.body as CreateDebtBody,
    );

    return reply.status(201).send(serializeDebt(debt));
  },

  deleteDebt: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const params = request.params as DebtParams;
    const debt = await debtService.deleteDebt(request.auth.clerkUserId, params.id);
    return serializeDebt(debt);
  },
};
