import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors/app-error.js";
import { AppHelper } from "../helpers/helper.js";
import type {
  CompletePlannedItemBody,
  CreatePlannedItemBody,
  ListPlannedItemsQuery,
  PlannedItemParams,
  UpdatePlannedItemBody,
} from "../schemas/planned-item.schema.js";
import { plannedItemService } from "../services/planned-item.services.js";

function serializePlannedItem(
  plannedItem: Awaited<ReturnType<typeof plannedItemService.createPlannedItem>>,
) {
  return {
    ...plannedItem,
    amount: plannedItem.amount.toString(),
    accountId: plannedItem.accountId ?? null,
    categoryId: plannedItem.categoryId ?? null,
    notes: plannedItem.notes ?? null,
    clientId: plannedItem.clientId ?? null,
    startDate: AppHelper._serializeDate(plannedItem.startDate),
    nextOccurrenceAt: plannedItem.nextOccurrenceAt
      ? AppHelper._serializeDate(plannedItem.nextOccurrenceAt)
      : null,
    lastProcessedAt: plannedItem.lastProcessedAt
      ? AppHelper._serializeDate(plannedItem.lastProcessedAt)
      : null,
    createdAt: AppHelper._serializeDate(plannedItem.createdAt),
    updatedAt: AppHelper._serializeDate(plannedItem.updatedAt),
    deletedAt: plannedItem.deletedAt ? AppHelper._serializeDate(plannedItem.deletedAt) : null,
    clientUpdatedAt: plannedItem.clientUpdatedAt
      ? AppHelper._serializeDate(plannedItem.clientUpdatedAt)
      : null,
  };
}

export const plannedItemController = {
  listPlannedItems: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const plannedItems = await plannedItemService.listPlannedItems(
      request.auth.clerkUserId,
      request.query as ListPlannedItemsQuery,
    );

    return plannedItems.map(serializePlannedItem);
  },

  createPlannedItem: async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const plannedItem = await plannedItemService.createPlannedItem(
      request.auth.clerkUserId,
      request.body as CreatePlannedItemBody,
    );

    return reply.status(201).send(serializePlannedItem(plannedItem));
  },

  updatePlannedItem: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const params = request.params as PlannedItemParams;
    const body = request.body as UpdatePlannedItemBody;

    const plannedItem = await plannedItemService.updatePlannedItem(
      request.auth.clerkUserId,
      params.id,
      body,
    );

    return serializePlannedItem(plannedItem);
  },

  completePlannedItem: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const params = request.params as PlannedItemParams;
    const body = (request.body ?? {}) as CompletePlannedItemBody;

    const plannedItem = await plannedItemService.completePlannedItem(
      request.auth.clerkUserId,
      params.id,
      body,
    );

    return serializePlannedItem(plannedItem);
  },

  deletePlannedItem: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const params = request.params as PlannedItemParams;

    const plannedItem = await plannedItemService.deletePlannedItem(
      request.auth.clerkUserId,
      params.id,
    );

    return serializePlannedItem(plannedItem);
  },
};
