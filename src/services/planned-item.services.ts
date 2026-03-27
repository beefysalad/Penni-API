import { AppError } from "../errors/app-error.js";
import { accountRepository } from "../repository/account.repository.js";
import { categoryRepository } from "../repository/category.repository.js";
import { plannedItemRepository } from "../repository/planned-item.repository.js";
import type {
  CreatePlannedItemBody,
  ListPlannedItemsQuery,
  UpdatePlannedItemBody,
} from "../schemas/planned-item.schema.js";
import { userService } from "./user.services.js";

export const plannedItemService = {
  listPlannedItems: async (clerkUserId: string, filters: ListPlannedItemsQuery) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return plannedItemRepository.listPlannedItemsByUserId(user.id, {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.accountId ? { accountId: filters.accountId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    });
  },

  createPlannedItem: async (clerkUserId: string, input: CreatePlannedItemBody) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    if (input.accountId) {
      await accountRepository.getAccountById(user.id, input.accountId);
    }

    if (input.categoryId) {
      const category = await categoryRepository.getCategoryById(user.id, input.categoryId);
      if (category.type !== input.type) {
        throw new AppError("Category type does not match planned item type", 422);
      }
    }

    return plannedItemRepository.createPlannedItem({
      userId: user.id,
      type: input.type,
      title: input.title,
      amount: input.amount,
      currency: input.currency,
      startDate: input.startDate,
      recurrence: input.recurrence,
      ...(input.semiMonthlyDays ? { semiMonthlyDays: input.semiMonthlyDays } : {}),
      ...(input.clientId ? { clientId: input.clientId } : {}),
      ...(input.accountId ? { accountId: input.accountId } : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.nextOccurrenceAt ? { nextOccurrenceAt: input.nextOccurrenceAt } : {}),
      ...(input.lastProcessedAt ? { lastProcessedAt: input.lastProcessedAt } : {}),
      ...(input.clientUpdatedAt ? { clientUpdatedAt: input.clientUpdatedAt } : {}),
    });
  },

  updatePlannedItem: async (
    clerkUserId: string,
    plannedItemId: string,
    input: UpdatePlannedItemBody,
  ) => {
    const user = await userService.ensureCurrentUser(clerkUserId);
    const existingPlannedItem = await plannedItemRepository.getPlannedItemById(user.id, plannedItemId);

    const nextType = input.type ?? existingPlannedItem.type;
    const nextAccountId = input.accountId !== undefined ? input.accountId : existingPlannedItem.accountId ?? undefined;
    const nextCategoryId =
      input.categoryId !== undefined ? input.categoryId : existingPlannedItem.categoryId ?? undefined;

    if (nextAccountId) {
      await accountRepository.getAccountById(user.id, nextAccountId);
    }

    if (nextCategoryId) {
      const category = await categoryRepository.getCategoryById(user.id, nextCategoryId);
      if (category.type !== nextType) {
        throw new AppError("Category type does not match planned item type", 422);
      }
    }

    return plannedItemRepository.updatePlannedItem(user.id, plannedItemId, {
      ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
      ...(input.accountId !== undefined ? { accountId: input.accountId } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.recurrence !== undefined ? { recurrence: input.recurrence } : {}),
      ...(input.semiMonthlyDays !== undefined ? { semiMonthlyDays: input.semiMonthlyDays } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.nextOccurrenceAt !== undefined
        ? { nextOccurrenceAt: input.nextOccurrenceAt }
        : {}),
      ...(input.lastProcessedAt !== undefined
        ? { lastProcessedAt: input.lastProcessedAt }
        : {}),
      ...(input.clientUpdatedAt !== undefined
        ? { clientUpdatedAt: input.clientUpdatedAt }
        : {}),
    });
  },

  deletePlannedItem: async (clerkUserId: string, plannedItemId: string) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return plannedItemRepository.softDeletePlannedItem(user.id, plannedItemId);
  },
};
