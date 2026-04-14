import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ensureCurrentUser = vi.fn();
const getAccountById = vi.fn();
const getCategoryById = vi.fn();
const getPlannedItemById = vi.fn();
const updatePlannedItem = vi.fn();
const findRecurringTransactionForPlannedItemOccurrence = vi.fn();
const createTransaction = vi.fn();

vi.mock("../src/services/user.services.js", () => ({
  userService: {
    ensureCurrentUser,
  },
}));

vi.mock("../src/repository/account.repository.js", () => ({
  accountRepository: {
    getAccountById,
  },
}));

vi.mock("../src/repository/category.repository.js", () => ({
  categoryRepository: {
    getCategoryById,
  },
}));

vi.mock("../src/repository/planned-item.repository.js", () => ({
  plannedItemRepository: {
    getPlannedItemById,
    updatePlannedItem,
    listPlannedItemsByUserId: vi.fn(),
    createPlannedItem: vi.fn(),
    softDeletePlannedItem: vi.fn(),
  },
}));

vi.mock("../src/repository/transaction.repository.js", () => ({
  transactionRepository: {
    findRecurringTransactionForPlannedItemOccurrence,
    createTransaction,
  },
}));

function buildPlannedItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "plan_1",
    userId: "user_1",
    accountId: "acc_1",
    categoryId: "cat_1",
    type: "EXPENSE",
    title: "Internet bill",
    notes: "Monthly internet",
    amount: { toString: () => "1699.00" },
    currency: "PHP",
    startDate: new Date("2026-04-01T00:00:00.000Z"),
    recurrence: "MONTHLY",
    semiMonthlyDays: [],
    isActive: true,
    nextOccurrenceAt: new Date("2026-04-02T16:00:00.000Z"),
    lastProcessedAt: null,
    ...overrides,
  };
}

describe("plannedItemService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T12:00:00.000Z"));
    ensureCurrentUser.mockResolvedValue({ id: "user_1" });
    getAccountById.mockResolvedValue({ id: "acc_1" });
    getCategoryById.mockResolvedValue({ id: "cat_1", type: "EXPENSE" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("recomputes next occurrence when the schedule changes", async () => {
    getPlannedItemById.mockResolvedValue(
      buildPlannedItem({
        nextOccurrenceAt: new Date("2026-04-30T16:00:00.000Z"),
      }),
    );
    updatePlannedItem.mockResolvedValue({ id: "plan_1" });

    const { plannedItemService } = await import("../src/services/planned-item.services.js");

    await plannedItemService.updatePlannedItem("clerk_123", "plan_1", {
      recurrence: "WEEKLY",
    });

    expect(updatePlannedItem).toHaveBeenCalledWith("user_1", "plan_1", expect.objectContaining({
      recurrence: "WEEKLY",
      nextOccurrenceAt: "2026-04-14T16:00:00.000Z",
    }));
  });

  it("does not create a duplicate recurring transaction for an already completed occurrence", async () => {
    const plannedItem = buildPlannedItem({
      nextOccurrenceAt: new Date("2026-04-30T16:00:00.000Z"),
      lastProcessedAt: new Date("2026-04-03T00:00:00.000Z"),
    });
    getPlannedItemById.mockResolvedValue(plannedItem);
    findRecurringTransactionForPlannedItemOccurrence.mockResolvedValue({
      id: "txn_existing",
      plannedItemId: "plan_1",
    });

    const { plannedItemService } = await import("../src/services/planned-item.services.js");

    const result = await plannedItemService.completePlannedItem("clerk_123", "plan_1", {
      transactionAt: "2026-04-03T00:00:00.000Z",
    });

    expect(createTransaction).not.toHaveBeenCalled();
    expect(updatePlannedItem).not.toHaveBeenCalled();
    expect(result).toBe(plannedItem);
  });

  it("repairs planned item state when the occurrence transaction already exists", async () => {
    getPlannedItemById.mockResolvedValue(buildPlannedItem());
    findRecurringTransactionForPlannedItemOccurrence.mockResolvedValue({
      id: "txn_existing",
      plannedItemId: "plan_1",
    });
    updatePlannedItem.mockResolvedValue({ id: "plan_1" });

    const { plannedItemService } = await import("../src/services/planned-item.services.js");

    await plannedItemService.completePlannedItem("clerk_123", "plan_1", {
      transactionAt: "2026-04-03T00:00:00.000Z",
    });

    expect(createTransaction).not.toHaveBeenCalled();
    expect(updatePlannedItem).toHaveBeenCalledWith("user_1", "plan_1", {
      nextOccurrenceAt: "2026-04-30T16:00:00.000Z",
      lastProcessedAt: "2026-04-03T00:00:00.000Z",
    });
  });
});
