import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors/app-error.js";
import { AppHelper } from "../helpers/helper.js";
import type {
  CreateTransactionBody,
  ListTransactionsQuery,
  TransactionParams,
  UpdateTransactionBody,
} from "../schemas/transaction.schema.js";
import { transactionService } from "../services/transaction.services.js";

function serializeTransaction(
  transaction: Awaited<ReturnType<typeof transactionService.createTransaction>>,
) {
  return {
    ...transaction,
    amount: transaction.amount.toString(),
    accountId: transaction.accountId ?? null,
    categoryId: transaction.categoryId ?? null,
    plannedItemId: transaction.plannedItemId ?? null,
    notes: transaction.notes ?? null,
    clientId: transaction.clientId ?? null,
    transactionAt: AppHelper._serializeDate(transaction.transactionAt),
    createdAt: AppHelper._serializeDate(transaction.createdAt),
    updatedAt: AppHelper._serializeDate(transaction.updatedAt),
    deletedAt: transaction.deletedAt ? AppHelper._serializeDate(transaction.deletedAt) : null,
    clientUpdatedAt: transaction.clientUpdatedAt
      ? AppHelper._serializeDate(transaction.clientUpdatedAt)
      : null,
  };
}

export const transactionController = {
  listTransactions: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const transactions = await transactionService.listTransactions(
      request.auth.clerkUserId,
      request.query as ListTransactionsQuery,
    );

    return transactions.map(serializeTransaction);
  },

  createTransaction: async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const transaction = await transactionService.createTransaction(
      request.auth.clerkUserId,
      request.body as CreateTransactionBody,
    );

    return reply.status(201).send(serializeTransaction(transaction));
  },

  updateTransaction: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const params = request.params as TransactionParams;
    const body = request.body as UpdateTransactionBody;

    const transaction = await transactionService.updateTransaction(
      request.auth.clerkUserId,
      params.id,
      body,
    );

    return serializeTransaction(transaction);
  },

  deleteTransaction: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const params = request.params as TransactionParams;

    const transaction = await transactionService.deleteTransaction(
      request.auth.clerkUserId,
      params.id,
    );

    return serializeTransaction(transaction);
  },
};
