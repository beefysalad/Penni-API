import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";

export type CreateAccountInput = {
  userId: string;
  clientId?: string;
  name: string;
  type: "CASH" | "BANK_ACCOUNT" | "E_WALLET" | "CREDIT_CARD" | "OTHER";
  currency: string;
  balance: string;
  creditLimit?: string;
  dueDayOfMonth?: number;
  statementDayOfMonth?: number;
  institutionName?: string;
  clientUpdatedAt?: string;
};

export type UpdateAccountInput = Partial<Omit<CreateAccountInput, "userId">>;

const creditCardInclude = {
  creditCard: true,
} as const;

export const accountRepository = {
  listAccountsByUserId: async (userId: string) => {
    return prisma.account.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: creditCardInclude,
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  createAccount: async (input: CreateAccountInput) => {
    return prisma.account.create({
      data: {
        userId: input.userId,
        name: input.name,
        type: input.type,
        currency: input.currency,
        balance: input.balance,
        ...(input.type === "CREDIT_CARD" && input.creditLimit && input.dueDayOfMonth
          ? {
              creditCard: {
                create: {
                  creditLimit: input.creditLimit,
                  dueDayOfMonth: input.dueDayOfMonth,
                  ...(input.statementDayOfMonth !== undefined
                    ? { statementDayOfMonth: input.statementDayOfMonth }
                    : {}),
                },
              },
            }
          : {}),
        ...(input.clientId ? { clientId: input.clientId } : {}),
        ...(input.institutionName
          ? { institutionName: input.institutionName }
          : {}),
        ...(input.clientUpdatedAt
          ? { clientUpdatedAt: new Date(input.clientUpdatedAt) }
          : {}),
      },
      include: creditCardInclude,
    });
  },

  getAccountById: async (userId: string, accountId: string) => {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
        deletedAt: null,
      },
      include: creditCardInclude,
    });

    if (!account) {
      throw new AppError("Account not found", 404);
    }

    return account;
  },

  updateAccount: async (userId: string, accountId: string, input: UpdateAccountInput) => {
    const existingAccount = await accountRepository.getAccountById(userId, accountId);
    const nextType = input.type ?? existingAccount.type;

    return prisma.account.update({
      where: {
        id: accountId,
      },
      data: {
        ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.balance !== undefined ? { balance: input.balance } : {}),
        ...(input.institutionName !== undefined
          ? { institutionName: input.institutionName }
          : {}),
        ...(nextType === "CREDIT_CARD"
          ? {
              creditCard: {
                upsert: {
                  create: {
                    creditLimit:
                      input.creditLimit ?? existingAccount.creditCard?.creditLimit.toString() ?? "0",
                    dueDayOfMonth:
                      input.dueDayOfMonth ?? existingAccount.creditCard?.dueDayOfMonth ?? 1,
                    ...(input.statementDayOfMonth !== undefined
                      ? { statementDayOfMonth: input.statementDayOfMonth }
                      : existingAccount.creditCard?.statementDayOfMonth !== null &&
                          existingAccount.creditCard?.statementDayOfMonth !== undefined
                        ? { statementDayOfMonth: existingAccount.creditCard.statementDayOfMonth }
                        : {}),
                  },
                  update: {
                    ...(input.creditLimit !== undefined ? { creditLimit: input.creditLimit } : {}),
                    ...(input.dueDayOfMonth !== undefined ? { dueDayOfMonth: input.dueDayOfMonth } : {}),
                    ...(input.statementDayOfMonth !== undefined
                      ? { statementDayOfMonth: input.statementDayOfMonth }
                      : {}),
                  },
                },
              },
            }
          : existingAccount.creditCard
            ? {
                creditCard: {
                  delete: true,
                },
              }
            : {}),
        ...(input.clientUpdatedAt !== undefined
          ? { clientUpdatedAt: new Date(input.clientUpdatedAt) }
          : {}),
      },
      include: creditCardInclude,
    });
  },

  softDeleteAccount: async (userId: string, accountId: string) => {
    await accountRepository.getAccountById(userId, accountId);

    return prisma.account.update({
      where: {
        id: accountId,
      },
      data: {
        deletedAt: new Date(),
        isArchived: true,
      },
      include: creditCardInclude,
    });
  },
};
