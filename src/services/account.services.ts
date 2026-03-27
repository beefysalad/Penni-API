import { accountRepository } from "../repository/account.repository.js";
import type {
  CreateAccountBody,
  UpdateAccountBody,
} from "../schemas/account.schema.js";
import { userService } from "./user.services.js";

export const accountService = {
  listAccounts: async (clerkUserId: string) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return accountRepository.listAccountsByUserId(user.id);
  },

  createAccount: async (
    clerkUserId: string,
    input: CreateAccountBody,
  ) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return accountRepository.createAccount({
      userId: user.id,
      name: input.name,
      type: input.type,
      currency: input.currency,
      balance: input.balance,
      ...(input.creditLimit ? { creditLimit: input.creditLimit } : {}),
      ...(input.availableCredit ? { availableCredit: input.availableCredit } : {}),
      ...(input.dueDayOfMonth ? { dueDayOfMonth: input.dueDayOfMonth } : {}),
      ...(input.clientId ? { clientId: input.clientId } : {}),
      ...(input.institutionName ? { institutionName: input.institutionName } : {}),
      ...(input.clientUpdatedAt
        ? { clientUpdatedAt: input.clientUpdatedAt }
        : {}),
    });
  },

  updateAccount: async (
    clerkUserId: string,
    accountId: string,
    input: UpdateAccountBody,
  ) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return accountRepository.updateAccount(user.id, accountId, {
      ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.balance !== undefined ? { balance: input.balance } : {}),
      ...(input.creditLimit !== undefined ? { creditLimit: input.creditLimit } : {}),
      ...(input.availableCredit !== undefined
        ? { availableCredit: input.availableCredit }
        : {}),
      ...(input.dueDayOfMonth !== undefined ? { dueDayOfMonth: input.dueDayOfMonth } : {}),
      ...(input.institutionName !== undefined
        ? { institutionName: input.institutionName }
        : {}),
      ...(input.clientUpdatedAt !== undefined
        ? { clientUpdatedAt: input.clientUpdatedAt }
        : {}),
    });
  },

  deleteAccount: async (clerkUserId: string, accountId: string) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return accountRepository.softDeleteAccount(user.id, accountId);
  },
};
