import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";

export type CreateAccountInput = {
  userId: string;
  clientId?: string;
  name: string;
  type: "CASH" | "BANK_ACCOUNT" | "E_WALLET" | "CREDIT_CARD" | "OTHER";
  currency: string;
  balance: string;
  institutionName?: string;
  clientUpdatedAt?: string;
};

export type UpdateAccountInput = Partial<Omit<CreateAccountInput, "userId">>;

export const accountRepository = {
  listAccountsByUserId: async (userId: string) => {
    return prisma.account.findMany({
      where: {
        userId,
        deletedAt: null,
      },
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
        ...(input.clientId ? { clientId: input.clientId } : {}),
        ...(input.institutionName
          ? { institutionName: input.institutionName }
          : {}),
        ...(input.clientUpdatedAt
          ? { clientUpdatedAt: new Date(input.clientUpdatedAt) }
          : {}),
      },
    });
  },

  getAccountById: async (userId: string, accountId: string) => {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
        deletedAt: null,
      },
    });

    if (!account) {
      throw new AppError("Account not found", 404);
    }

    return account;
  },

  updateAccount: async (userId: string, accountId: string, input: UpdateAccountInput) => {
    await accountRepository.getAccountById(userId, accountId);

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
        ...(input.clientUpdatedAt !== undefined
          ? { clientUpdatedAt: new Date(input.clientUpdatedAt) }
          : {}),
      },
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
    });
  },
};
