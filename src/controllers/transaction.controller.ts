import type { FastifyReply, FastifyRequest } from "fastify";
import type { z } from "zod";
import { AppError } from "../errors/app-error.js";
import { AppHelper } from "../helpers/helper.js";
import type {
  CreateTransferBody,
  CreateTransactionBody,
  ListTransactionsQuery,
  TransactionParams,
  UpdateTransactionBody,
} from "../schemas/transaction.schema.js";
import { transactionResponseSchema } from "../schemas/transaction.schema.js";
import { transactionService } from "../services/transaction.services.js";

type SerializedTransaction = z.infer<typeof transactionResponseSchema>;

function serializeTransaction(
  transaction: {
    id: string;
    userId: string;
    amount: { toString(): string };
    accountId: string | null;
    categoryId: string | null;
    plannedItemId: string | null;
    type: "EXPENSE" | "INCOME";
    source: "MANUAL" | "RECURRING" | "IMPORTED" | "TRANSFER";
    title: string;
    notes: string | null;
    currency: string;
    clientId: string | null;
    transactionAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    clientUpdatedAt: Date | null;
  },
) : SerializedTransaction {
  return {
    id: transaction.id,
    userId: transaction.userId,
    type: transaction.type,
    source: transaction.source,
    title: transaction.title,
    amount: transaction.amount.toString(),
    currency: transaction.currency,
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

    const result = await transactionService.listTransactions(
      request.auth.clerkUserId,
      request.query as ListTransactionsQuery,
    );

    return {
      data: result.data.map(serializeTransaction),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      summary: result.summary,
    };
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

  createTransfer: async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const transfer = await transactionService.createTransfer(
      request.auth.clerkUserId,
      request.body as CreateTransferBody,
    );

    return reply.status(201).send({
      outgoingTransaction: serializeTransaction(transfer.outgoingTransaction),
      incomingTransaction: serializeTransaction(transfer.incomingTransaction),
    });
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
