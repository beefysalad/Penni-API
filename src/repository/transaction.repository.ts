import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";

export type TransactionType = "EXPENSE" | "INCOME";
export type TransactionSource = "MANUAL" | "RECURRING" | "IMPORTED" | "TRANSFER";

export type CreateTransactionInput = {
  userId: string;
  clientId?: string;
  accountId?: string;
  categoryId?: string;
  plannedItemId?: string;
  type: TransactionType;
  source: TransactionSource;
  title: string;
  notes?: string;
  amount: string;
  currency: string;
  transactionAt: string;
  clientUpdatedAt?: string;
};

export type UpdateTransactionInput = Partial<Omit<CreateTransactionInput, "userId">>;

export type CreateTransferInput = {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  title?: string;
  notes?: string;
  amount: string;
  transactionAt: string;
  clientUpdatedAt?: string;
};

export type ListTransactionsInput = {
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
};

function getBalanceOperation(
  type: TransactionType,
  amount: string,
  direction: "apply" | "reverse",
) {
  const shouldIncrease =
    (direction === "apply" && type === "INCOME") ||
    (direction === "reverse" && type === "EXPENSE");

  return shouldIncrease
    ? { increment: amount }
    : { decrement: amount };
}

function getCreditCardBalanceDelta(
  type: TransactionType,
  amount: number,
  direction: "apply" | "reverse",
) {
  if (direction === "apply") {
    return type === "EXPENSE" ? amount : -amount;
  }

  return type === "EXPENSE" ? -amount : amount;
}

function buildAccountUpdateData(
  account: {
    type: string;
    balance: { toString(): string } | string | number;
  },
  type: TransactionType,
  amount: string,
  direction: "apply" | "reverse",
) {
  if (account.type !== "CREDIT_CARD") {
    return {
      balance: getBalanceOperation(type, amount, direction),
    };
  }

  const currentBalance = Number(account.balance);
  const nextBalance = Math.max(
    0,
    currentBalance + getCreditCardBalanceDelta(type, Number(amount), direction),
  );

  return {
    balance: nextBalance.toFixed(2),
  };
}

function buildWhereClause(userId: string, filters: ListTransactionsInput) {
  return {
    userId,
    deletedAt: null,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.accountId ? { accountId: filters.accountId } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.from || filters.to
      ? {
          transactionAt: {
            ...(filters.from ? { gte: new Date(filters.from) } : {}),
            ...(filters.to ? { lte: new Date(filters.to) } : {}),
          },
        }
      : {}),
  };
}

export const transactionRepository = {
  listTransactionsByUserId: async (userId: string, filters: ListTransactionsInput) => {
    const limit = filters.limit ?? 20;
    const where = buildWhereClause(userId, filters);

    return prisma.transaction.findMany({
      where,
      orderBy: [{ transactionAt: "desc" }, { createdAt: "desc" }],
      take: limit + 1,
      ...(filters.cursor
        ? {
            cursor: { id: filters.cursor },
            skip: 1,
          }
        : {}),
    });
  },

  getTransactionSummary: async (userId: string, filters: ListTransactionsInput) => {
    const where = buildWhereClause(userId, filters);

    const groups = await prisma.transaction.groupBy({
      by: ["type"],
      where: {
        ...where,
        source: {
          not: "TRANSFER",
        },
      },
      _sum: { amount: true },
    });

    let totalIncome = "0";
    let totalExpense = "0";

    for (const group of groups) {
      if (group.type === "INCOME") {
        totalIncome = (group._sum.amount ?? 0).toString();
      } else if (group.type === "EXPENSE") {
        totalExpense = (group._sum.amount ?? 0).toString();
      }
    }

    return { totalIncome, totalExpense };
  },

  createTransaction: async (input: CreateTransactionInput) => {
    return prisma.$transaction(async (tx) => {
      if (input.accountId) {
        const account = await tx.account.findFirst({
          where: {
            id: input.accountId,
            userId: input.userId,
            deletedAt: null,
          },
          include: {
            creditCard: true,
          },
        });

        if (!account) {
          throw new AppError("Account not found", 404);
        }

        await tx.account.update({
          where: {
            id: input.accountId,
          },
          data: buildAccountUpdateData(account, input.type, input.amount, "apply"),
        });
      }

      return tx.transaction.create({
        data: {
          userId: input.userId,
          type: input.type,
          source: input.source,
          title: input.title,
          amount: input.amount,
          currency: input.currency,
          transactionAt: new Date(input.transactionAt),
          ...(input.clientId ? { clientId: input.clientId } : {}),
          ...(input.accountId ? { accountId: input.accountId } : {}),
          ...(input.categoryId ? { categoryId: input.categoryId } : {}),
          ...(input.plannedItemId ? { plannedItemId: input.plannedItemId } : {}),
          ...(input.notes ? { notes: input.notes } : {}),
          ...(input.clientUpdatedAt
            ? { clientUpdatedAt: new Date(input.clientUpdatedAt) }
            : {}),
        },
      });
    });
  },

  createTransfer: async (input: CreateTransferInput) => {
    return prisma.$transaction(async (tx) => {
      const [fromAccount, toAccount] = await Promise.all([
        tx.account.findFirst({
          where: {
            id: input.fromAccountId,
            userId: input.userId,
            deletedAt: null,
          },
          include: {
            creditCard: true,
          },
        }),
        tx.account.findFirst({
          where: {
            id: input.toAccountId,
            userId: input.userId,
            deletedAt: null,
          },
          include: {
            creditCard: true,
          },
        }),
      ]);

      if (!fromAccount || !toAccount) {
        throw new AppError("Account not found", 404);
      }

      await tx.account.update({
        where: {
          id: input.fromAccountId,
        },
        data: buildAccountUpdateData(fromAccount, "EXPENSE", input.amount, "apply"),
      });

      await tx.account.update({
        where: {
          id: input.toAccountId,
        },
        data: buildAccountUpdateData(toAccount, "INCOME", input.amount, "apply"),
      });

      const transactionAt = new Date(input.transactionAt);
      const clientUpdatedAt = input.clientUpdatedAt ? new Date(input.clientUpdatedAt) : undefined;
      const baseTitle = input.title?.trim();

      const outgoingTransaction = await tx.transaction.create({
        data: {
          userId: input.userId,
          accountId: input.fromAccountId,
          type: "EXPENSE",
          source: "TRANSFER",
          title: baseTitle || `Transfer to ${toAccount.name}`,
          amount: input.amount,
          currency: fromAccount.currency,
          transactionAt,
          ...(input.notes ? { notes: input.notes } : {}),
          ...(clientUpdatedAt ? { clientUpdatedAt } : {}),
        },
      });

      const incomingTransaction = await tx.transaction.create({
        data: {
          userId: input.userId,
          accountId: input.toAccountId,
          type: "INCOME",
          source: "TRANSFER",
          title: baseTitle || `Transfer from ${fromAccount.name}`,
          amount: input.amount,
          currency: toAccount.currency,
          transactionAt,
          ...(input.notes ? { notes: input.notes } : {}),
          ...(clientUpdatedAt ? { clientUpdatedAt } : {}),
        },
      });

      return {
        outgoingTransaction,
        incomingTransaction,
      };
    });
  },

  getTransactionById: async (userId: string, transactionId: string) => {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
        deletedAt: null,
      },
    });

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    return transaction;
  },

  updateTransaction: async (
    userId: string,
    transactionId: string,
    input: UpdateTransactionInput,
  ) => {
    return prisma.$transaction(async (tx) => {
      const existingTransaction = await tx.transaction.findFirst({
        where: {
          id: transactionId,
          userId,
          deletedAt: null,
        },
      });

      if (!existingTransaction) {
        throw new AppError("Transaction not found", 404);
      }

      const nextType = input.type ?? existingTransaction.type;
      const nextAmount = input.amount ?? existingTransaction.amount.toString();
      const nextAccountId =
        input.accountId !== undefined ? input.accountId : existingTransaction.accountId;

      if (existingTransaction.accountId) {
        const existingAccount = await tx.account.findFirst({
          where: {
            id: existingTransaction.accountId,
            userId,
            deletedAt: null,
          },
          include: {
            creditCard: true,
          },
        });

        if (existingAccount) {
          await tx.account.update({
            where: {
              id: existingTransaction.accountId,
            },
            data: buildAccountUpdateData(
              existingAccount,
              existingTransaction.type,
              existingTransaction.amount.toString(),
              "reverse",
            ),
          });
        }
      }

      if (nextAccountId) {
        const nextAccount = await tx.account.findFirst({
          where: {
            id: nextAccountId,
            userId,
            deletedAt: null,
          },
          include: {
            creditCard: true,
          },
        });

        if (!nextAccount) {
          throw new AppError("Account not found", 404);
        }

        await tx.account.update({
          where: {
            id: nextAccountId,
          },
          data: buildAccountUpdateData(nextAccount, nextType, nextAmount, "apply"),
        });
      }

      return tx.transaction.update({
        where: {
          id: transactionId,
        },
        data: {
          ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
          ...(input.accountId !== undefined ? { accountId: input.accountId } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
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
            ? { transactionAt: new Date(input.transactionAt) }
            : {}),
          ...(input.clientUpdatedAt !== undefined
            ? { clientUpdatedAt: new Date(input.clientUpdatedAt) }
            : {}),
        },
      });
    });
  },

  softDeleteTransaction: async (userId: string, transactionId: string) => {
    return prisma.$transaction(async (tx) => {
      const existingTransaction = await tx.transaction.findFirst({
        where: {
          id: transactionId,
          userId,
          deletedAt: null,
        },
      });

      if (!existingTransaction) {
        throw new AppError("Transaction not found", 404);
      }

      if (existingTransaction.accountId) {
        const account = await tx.account.findFirst({
          where: {
            id: existingTransaction.accountId,
            userId,
            deletedAt: null,
          },
          include: {
            creditCard: true,
          },
        });

        if (account) {
          await tx.account.update({
            where: {
              id: existingTransaction.accountId,
            },
            data: buildAccountUpdateData(
              account,
              existingTransaction.type,
              existingTransaction.amount.toString(),
              "reverse",
            ),
          });
        }
      }

      return tx.transaction.update({
        where: {
          id: transactionId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    });
  },
};
