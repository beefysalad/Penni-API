import { AppError } from "../errors/app-error.js";
import { accountRepository } from "../repository/account.repository.js";
import { categoryRepository } from "../repository/category.repository.js";
import { plannedItemRepository } from "../repository/planned-item.repository.js";
import { transactionRepository } from "../repository/transaction.repository.js";
import type {
  CreateTransferBody,
  CreateTransactionBody,
  ListTransactionsQuery,
  UpdateTransactionBody,
} from "../schemas/transaction.schema.js";
import { userService } from "./user.services.js";

function validateCreditCardExpenseLimit(
  account: {
    type: string;
    availableCredit: { toString(): string } | string | number | null;
  },
  type: "EXPENSE" | "INCOME",
  amount: string,
) {
  if (account.type !== "CREDIT_CARD" || type !== "EXPENSE") {
    return;
  }

  const availableCredit = Number(account.availableCredit ?? 0);

  if (Number(amount) > availableCredit) {
    throw new AppError("Charge exceeds the card's available credit", 422);
  }
}

export const transactionService = {
  listTransactions: async (
    clerkUserId: string,
    filters: ListTransactionsQuery,
  ) => {
    const user = await userService.ensureCurrentUser(clerkUserId);
    const limit = filters.limit ?? 20;

    const repoFilters = {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.accountId ? { accountId: filters.accountId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
      ...(filters.cursor ? { cursor: filters.cursor } : {}),
      limit,
    };

    const [transactions, summary] = await Promise.all([
      transactionRepository.listTransactionsByUserId(user.id, repoFilters),
      transactionRepository.getTransactionSummary(user.id, repoFilters),
    ]);

    const hasMore = transactions.length > limit;
    const data = hasMore ? transactions.slice(0, limit) : transactions;
    const nextCursor = hasMore ? data[data.length - 1]!.id : null;

    return { data, nextCursor, hasMore, summary };
  },

  createTransaction: async (
    clerkUserId: string,
    input: CreateTransactionBody,
  ) => {
    const user = await userService.ensureCurrentUser(clerkUserId);
    let account:
      | Awaited<ReturnType<typeof accountRepository.getAccountById>>
      | null = null;

    if (input.accountId) {
      account = await accountRepository.getAccountById(user.id, input.accountId);
      validateCreditCardExpenseLimit(account, input.type, input.amount);
    }

    if (input.categoryId) {
      const category = await categoryRepository.getCategoryById(
        user.id,
        input.categoryId,
      );
      if (category.type !== input.type) {
        throw new AppError(
          "Category type does not match transaction type",
          422,
        );
      }
    }

    if (input.plannedItemId) {
      await plannedItemRepository.getPlannedItemById(
        user.id,
        input.plannedItemId,
      );
    }

    return transactionRepository.createTransaction({
      userId: user.id,
      type: input.type,
      source: input.source,
      title: input.title,
      amount: input.amount,
      currency: input.currency,
      transactionAt: input.transactionAt,
      ...(input.clientId ? { clientId: input.clientId } : {}),
      ...(input.accountId ? { accountId: input.accountId } : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.plannedItemId ? { plannedItemId: input.plannedItemId } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
      ...(input.clientUpdatedAt
        ? { clientUpdatedAt: input.clientUpdatedAt }
        : {}),
    });
  },

  createTransfer: async (clerkUserId: string, input: CreateTransferBody) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    if (input.fromAccountId === input.toAccountId) {
      throw new AppError("Transfer accounts must be different", 422);
    }

    const [fromAccount, toAccount] = await Promise.all([
      accountRepository.getAccountById(user.id, input.fromAccountId),
      accountRepository.getAccountById(user.id, input.toAccountId),
    ]);

    if (fromAccount.type === "CREDIT_CARD") {
      throw new AppError("Transfers from credit cards are not supported yet", 422);
    }

    if (fromAccount.currency !== toAccount.currency) {
      throw new AppError(
        "Transfer POC currently supports same-currency accounts only",
        422,
      );
    }

    return transactionRepository.createTransfer({
      userId: user.id,
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      amount: input.amount,
      transactionAt: input.transactionAt,
      ...(input.title ? { title: input.title } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
      ...(input.clientUpdatedAt
        ? { clientUpdatedAt: input.clientUpdatedAt }
        : {}),
    });
  },

  updateTransaction: async (
    clerkUserId: string,
    transactionId: string,
    input: UpdateTransactionBody,
  ) => {
    const user = await userService.ensureCurrentUser(clerkUserId);
    const existingTransaction = await transactionRepository.getTransactionById(
      user.id,
      transactionId,
    );

    const nextType = input.type ?? existingTransaction.type;
    const nextAccountId =
      input.accountId !== undefined
        ? input.accountId
        : (existingTransaction.accountId ?? undefined);
    const nextCategoryId =
      input.categoryId !== undefined
        ? input.categoryId
        : (existingTransaction.categoryId ?? undefined);
    const nextPlannedItemId =
      input.plannedItemId !== undefined
        ? input.plannedItemId
        : (existingTransaction.plannedItemId ?? undefined);

    if (nextAccountId) {
      const nextAccount = await accountRepository.getAccountById(user.id, nextAccountId);
      const existingAmount = Number(existingTransaction.amount);
      const nextAmount = Number(input.amount ?? existingTransaction.amount);
      const availableCredit = Number(nextAccount.availableCredit ?? 0);
      const isSameCreditCard =
        nextAccount.type === "CREDIT_CARD" &&
        existingTransaction.accountId === nextAccountId;
      const effectiveAvailableCredit =
        isSameCreditCard && existingTransaction.type === "EXPENSE"
          ? availableCredit + existingAmount
          : availableCredit;

      if (nextAccount.type === "CREDIT_CARD" && nextType === "EXPENSE" && nextAmount > effectiveAvailableCredit) {
        throw new AppError("Charge exceeds the card's available credit", 422);
      }
    }

    if (nextCategoryId) {
      const category = await categoryRepository.getCategoryById(
        user.id,
        nextCategoryId,
      );
      if (category.type !== nextType) {
        throw new AppError(
          "Category type does not match transaction type",
          422,
        );
      }
    }

    if (nextPlannedItemId) {
      await plannedItemRepository.getPlannedItemById(
        user.id,
        nextPlannedItemId,
      );
    }

    return transactionRepository.updateTransaction(user.id, transactionId, {
      ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
      ...(input.accountId !== undefined ? { accountId: input.accountId } : {}),
      ...(input.categoryId !== undefined
        ? { categoryId: input.categoryId }
        : {}),
      ...(input.plannedItemId !== undefined
        ? { plannedItemId: input.plannedItemId }
        : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.transactionAt !== undefined
        ? { transactionAt: input.transactionAt }
        : {}),
      ...(input.clientUpdatedAt !== undefined
        ? { clientUpdatedAt: input.clientUpdatedAt }
        : {}),
    });
  },

  deleteTransaction: async (clerkUserId: string, transactionId: string) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return transactionRepository.softDeleteTransaction(user.id, transactionId);
  },
};
