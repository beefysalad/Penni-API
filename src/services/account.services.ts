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
    const isCreditCard = input.type === "CREDIT_CARD";
    const balance =
      isCreditCard && input.creditCard?.creditLimit && input.creditCard?.availableCredit
        ? (Number(input.creditCard.creditLimit) - Number(input.creditCard.availableCredit)).toFixed(2)
        : input.balance;

    return accountRepository.createAccount({
      userId: user.id,
      name: input.name,
      type: input.type,
      currency: input.currency,
      balance,
      ...(input.creditCard?.creditLimit ? { creditLimit: input.creditCard.creditLimit } : {}),
      ...(input.creditCard?.dueDayOfMonth ? { dueDayOfMonth: input.creditCard.dueDayOfMonth } : {}),
      ...(input.creditCard?.statementDayOfMonth !== undefined
        ? { statementDayOfMonth: input.creditCard.statementDayOfMonth }
        : {}),
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
    const isCreditCard = input.type === "CREDIT_CARD";
    const balance =
      isCreditCard && input.creditCard?.creditLimit && input.creditCard?.availableCredit
        ? (Number(input.creditCard.creditLimit) - Number(input.creditCard.availableCredit)).toFixed(2)
        : input.balance;

    return accountRepository.updateAccount(user.id, accountId, {
      ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(balance !== undefined ? { balance } : {}),
      ...(input.creditCard?.creditLimit !== undefined ? { creditLimit: input.creditCard.creditLimit } : {}),
      ...(input.creditCard?.dueDayOfMonth !== undefined ? { dueDayOfMonth: input.creditCard.dueDayOfMonth } : {}),
      ...(input.creditCard?.statementDayOfMonth !== undefined
        ? { statementDayOfMonth: input.creditCard.statementDayOfMonth }
        : {}),
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
