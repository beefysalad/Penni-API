import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";

export type TransactionType = "EXPENSE" | "INCOME";
export type RecurrenceFrequency = "WEEKLY" | "MONTHLY" | "SEMI_MONTHLY" | "QUARTERLY" | "YEARLY";

export type CreatePlannedItemInput = {
  userId: string;
  clientId?: string;
  accountId?: string;
  categoryId?: string;
  type: TransactionType;
  title: string;
  notes?: string;
  amount: string;
  currency: string;
  startDate: string;
  recurrence: RecurrenceFrequency;
  semiMonthlyDays?: number[];
  isActive?: boolean;
  nextOccurrenceAt?: string;
  lastProcessedAt?: string;
  clientUpdatedAt?: string;
};

export type UpdatePlannedItemInput = Partial<Omit<CreatePlannedItemInput, "userId">>;

export type ListPlannedItemsInput = {
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  isActive?: boolean;
};

export const plannedItemRepository = {
  listPlannedItemsByUserId: async (userId: string, filters: ListPlannedItemsInput) => {
    return prisma.plannedItem.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.accountId ? { accountId: filters.accountId } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      },
      orderBy: [{ nextOccurrenceAt: "asc" }, { startDate: "asc" }, { createdAt: "desc" }],
    });
  },

  createPlannedItem: async (input: CreatePlannedItemInput) => {
    return prisma.plannedItem.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        amount: input.amount,
        currency: input.currency,
        startDate: new Date(input.startDate),
        recurrence: input.recurrence,
        semiMonthlyDays: input.semiMonthlyDays ?? [],
        isActive: input.isActive ?? true,
        ...(input.clientId ? { clientId: input.clientId } : {}),
        ...(input.accountId ? { accountId: input.accountId } : {}),
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
        ...(input.notes ? { notes: input.notes } : {}),
        ...(input.nextOccurrenceAt
          ? { nextOccurrenceAt: new Date(input.nextOccurrenceAt) }
          : { nextOccurrenceAt: new Date(input.startDate) }),
        ...(input.lastProcessedAt
          ? { lastProcessedAt: new Date(input.lastProcessedAt) }
          : {}),
        ...(input.clientUpdatedAt
          ? { clientUpdatedAt: new Date(input.clientUpdatedAt) }
          : {}),
      },
    });
  },

  getPlannedItemById: async (userId: string, plannedItemId: string) => {
    const plannedItem = await prisma.plannedItem.findFirst({
      where: {
        id: plannedItemId,
        userId,
        deletedAt: null,
      },
    });

    if (!plannedItem) {
      throw new AppError("Planned item not found", 404);
    }

    return plannedItem;
  },

  updatePlannedItem: async (
    userId: string,
    plannedItemId: string,
    input: UpdatePlannedItemInput,
  ) => {
    await plannedItemRepository.getPlannedItemById(userId, plannedItemId);

    return prisma.plannedItem.update({
      where: {
        id: plannedItemId,
      },
      data: {
        ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
        ...(input.accountId !== undefined ? { accountId: input.accountId } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.startDate !== undefined
          ? { startDate: new Date(input.startDate) }
          : {}),
        ...(input.recurrence !== undefined ? { recurrence: input.recurrence } : {}),
        ...(input.semiMonthlyDays !== undefined ? { semiMonthlyDays: input.semiMonthlyDays } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.nextOccurrenceAt !== undefined
          ? { nextOccurrenceAt: new Date(input.nextOccurrenceAt) }
          : {}),
        ...(input.lastProcessedAt !== undefined
          ? { lastProcessedAt: new Date(input.lastProcessedAt) }
          : {}),
        ...(input.clientUpdatedAt !== undefined
          ? { clientUpdatedAt: new Date(input.clientUpdatedAt) }
          : {}),
      },
    });
  },

  softDeletePlannedItem: async (userId: string, plannedItemId: string) => {
    await plannedItemRepository.getPlannedItemById(userId, plannedItemId);

    return prisma.plannedItem.update({
      where: {
        id: plannedItemId,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  },
};
