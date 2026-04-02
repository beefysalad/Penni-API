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

type PlannedItemRecord = Awaited<ReturnType<typeof plannedItemRepository.getPlannedItemById>>;

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function endOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function clampDayOfMonth(year: number, month: number, day: number) {
  return Math.min(day, endOfMonth(year, month));
}

function getSemiMonthlyNextOccurrence(fromDate: Date, startDate: Date, days: number[]) {
  const sortedDays = [...days].sort((a, b) => a - b);
  const cursor = startOfDay(fromDate);
  const minimumDate = startOfDay(startDate);
  const base = cursor > minimumDate ? cursor : minimumDate;

  for (let monthOffset = 0; monthOffset < 24; monthOffset += 1) {
    const year = base.getFullYear();
    const month = base.getMonth() + monthOffset;
    const iterYear = year + Math.floor(month / 12);
    const iterMonth = ((month % 12) + 12) % 12;

    for (const day of sortedDays) {
      const candidate = new Date(iterYear, iterMonth, clampDayOfMonth(iterYear, iterMonth, day));
      if (candidate >= base && candidate >= minimumDate) {
        return candidate;
      }
    }
  }

  return minimumDate;
}

function getNextOccurrenceForRecurrence(
  recurrence: PlannedItemRecord["recurrence"] | CreatePlannedItemBody["recurrence"],
  startDate: Date,
  semiMonthlyDays: number[],
  fromDate = new Date(),
) {
  const minimumDate = startOfDay(startDate);
  const cursor = startOfDay(fromDate);
  const base = cursor > minimumDate ? cursor : minimumDate;

  if (recurrence === "SEMI_MONTHLY") {
    return getSemiMonthlyNextOccurrence(base, minimumDate, semiMonthlyDays);
  }

  const candidate = new Date(minimumDate);

  while (candidate < base) {
    if (recurrence === "WEEKLY") {
      candidate.setDate(candidate.getDate() + 7);
      continue;
    }

    if (recurrence === "MONTHLY") {
      candidate.setMonth(candidate.getMonth() + 1);
      continue;
    }

    if (recurrence === "QUARTERLY") {
      candidate.setMonth(candidate.getMonth() + 3);
      continue;
    }

    if (recurrence === "YEARLY") {
      candidate.setFullYear(candidate.getFullYear() + 1);
      continue;
    }
  }

  return candidate;
}

function normalizeNextOccurrence(item: {
  recurrence: PlannedItemRecord["recurrence"] | CreatePlannedItemBody["recurrence"];
  startDate: Date | string;
  semiMonthlyDays?: number[];
  nextOccurrenceAt?: Date | string | null;
  isActive?: boolean;
}) {
  if (item.isActive === false) return null;

  const startDate = new Date(item.startDate);
  const nextOccurrenceAt = item.nextOccurrenceAt ? new Date(item.nextOccurrenceAt) : null;
  const days = item.semiMonthlyDays ?? [];
  const referenceDate = nextOccurrenceAt && nextOccurrenceAt > startOfDay(new Date())
    ? nextOccurrenceAt
    : new Date();

  return getNextOccurrenceForRecurrence(item.recurrence, startDate, days, referenceDate);
}

export const plannedItemService = {
  listPlannedItems: async (clerkUserId: string, filters: ListPlannedItemsQuery) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    const plannedItems = await plannedItemRepository.listPlannedItemsByUserId(user.id, {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.accountId ? { accountId: filters.accountId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    });

    const normalizedItems = await Promise.all(
      plannedItems.map(async (plannedItem) => {
        const normalizedNextOccurrence = normalizeNextOccurrence(plannedItem);

        if (
          normalizedNextOccurrence &&
          (!plannedItem.nextOccurrenceAt ||
            plannedItem.nextOccurrenceAt.getTime() !== normalizedNextOccurrence.getTime())
        ) {
          return plannedItemRepository.updatePlannedItem(user.id, plannedItem.id, {
            nextOccurrenceAt: normalizedNextOccurrence.toISOString(),
          });
        }

        return plannedItem;
      }),
    );

    return normalizedItems;
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

    const normalizedNextOccurrence = normalizeNextOccurrence({
      recurrence: input.recurrence,
      startDate: input.startDate,
      ...(input.semiMonthlyDays ? { semiMonthlyDays: input.semiMonthlyDays } : {}),
      ...(input.nextOccurrenceAt ? { nextOccurrenceAt: input.nextOccurrenceAt } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });

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
      ...(normalizedNextOccurrence ? { nextOccurrenceAt: normalizedNextOccurrence.toISOString() } : {}),
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

    const nextStartDate = input.startDate ?? existingPlannedItem.startDate.toISOString();
    const nextRecurrence = input.recurrence ?? existingPlannedItem.recurrence;
    const nextSemiMonthlyDays = input.semiMonthlyDays ?? existingPlannedItem.semiMonthlyDays;
    const nextIsActive = input.isActive ?? existingPlannedItem.isActive;
    const normalizedNextOccurrence =
      input.nextOccurrenceAt !== undefined
        ? input.nextOccurrenceAt
        : normalizeNextOccurrence({
            recurrence: nextRecurrence,
            startDate: nextStartDate,
            ...(nextSemiMonthlyDays ? { semiMonthlyDays: nextSemiMonthlyDays } : {}),
            ...(existingPlannedItem.nextOccurrenceAt
              ? { nextOccurrenceAt: existingPlannedItem.nextOccurrenceAt }
              : {}),
            ...(nextIsActive !== undefined ? { isActive: nextIsActive } : {}),
          })?.toISOString();

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
      ...(normalizedNextOccurrence !== undefined ? { nextOccurrenceAt: normalizedNextOccurrence } : {}),
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
