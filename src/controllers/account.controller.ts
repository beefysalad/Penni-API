import type { FastifyReply, FastifyRequest } from "fastify";
import { AppHelper } from "../helpers/helper.js";
import { AppError } from "../errors/app-error.js";
import { accountService } from "../services/account.services.js";
import type {
  AccountParams,
  CreateAccountBody,
  UpdateAccountBody,
} from "../schemas/account.schema.js";

function serializeAccount(account: Awaited<ReturnType<typeof accountService.createAccount>>) {
  return {
    ...account,
    balance: account.balance.toString(),
    creditLimit: account.creditLimit ? account.creditLimit.toString() : null,
    availableCredit: account.availableCredit ? account.availableCredit.toString() : null,
    dueDayOfMonth: account.dueDayOfMonth ?? null,
    lastSyncedAt: account.lastSyncedAt
      ? AppHelper._serializeDate(account.lastSyncedAt)
      : null,
    createdAt: AppHelper._serializeDate(account.createdAt),
    updatedAt: AppHelper._serializeDate(account.updatedAt),
    deletedAt: account.deletedAt ? AppHelper._serializeDate(account.deletedAt) : null,
    clientUpdatedAt: account.clientUpdatedAt
      ? AppHelper._serializeDate(account.clientUpdatedAt)
      : null,
    institutionName: account.institutionName ?? null,
    clientId: account.clientId ?? null,
  };
}

export const accountController = {
  listAccounts: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const accounts = await accountService.listAccounts(request.auth.clerkUserId);

    return accounts.map(serializeAccount);
  },

  createAccount: async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const account = await accountService.createAccount(
      request.auth.clerkUserId,
      request.body as CreateAccountBody,
    );

    return reply.status(201).send(serializeAccount(account));
  },

  updateAccount: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const params = request.params as AccountParams;
    const body = request.body as UpdateAccountBody;

    const account = await accountService.updateAccount(
      request.auth.clerkUserId,
      params.id,
      body,
    );

    return serializeAccount(account);
  },

  deleteAccount: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const params = request.params as AccountParams;

    const account = await accountService.deleteAccount(
      request.auth.clerkUserId,
      params.id,
    );

    return serializeAccount(account);
  },
};
