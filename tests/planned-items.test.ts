import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const verifyClerkSessionToken = vi.fn();
const listPlannedItems = vi.fn();
const createPlannedItem = vi.fn();
const updatePlannedItem = vi.fn();
const deletePlannedItem = vi.fn();
const completePlannedItem = vi.fn();

vi.mock("../src/lib/clerk.js", () => ({
  ClerkLib: {
    verifyClerkSessionToken,
    getClerkUserById: vi.fn(),
  },
  clerkClient: {},
}));

vi.mock("../src/services/planned-item.services.js", () => ({
  plannedItemService: {
    listPlannedItems,
    createPlannedItem,
    updatePlannedItem,
    deletePlannedItem,
    completePlannedItem,
  },
}));

describe("planned items", () => {
  let app: Awaited<ReturnType<typeof import("../src/bootstrap.js")["buildServer"]>>;

  beforeAll(async () => {
    const { buildServer } = await import("../src/bootstrap.js");
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("completes a planned item occurrence", async () => {
    verifyClerkSessionToken.mockResolvedValue({
      sub: "user_clerk_123",
      sid: "sess_123",
    });

    completePlannedItem.mockResolvedValue({
      id: "plan_1",
      clientId: null,
      userId: "user_1",
      accountId: "acc_1",
      categoryId: null,
      type: "EXPENSE",
      title: "Internet bill",
      notes: null,
      amount: { toString: () => "1699.00" },
      currency: "PHP",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      recurrence: "MONTHLY",
      semiMonthlyDays: [],
      isActive: true,
      nextOccurrenceAt: new Date("2026-05-01T00:00:00.000Z"),
      lastProcessedAt: new Date("2026-04-03T00:00:00.000Z"),
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-03T00:00:00.000Z"),
      deletedAt: null,
      clientUpdatedAt: null,
    });

    const response = await app.inject({
      method: "PATCH",
      url: "/api/planned-items/plan_1/complete",
      headers: {
        authorization: "Bearer valid-token",
      },
      payload: {
        transactionAt: "2026-04-03T00:00:00.000Z",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(completePlannedItem).toHaveBeenCalledWith("user_clerk_123", "plan_1", {
      transactionAt: "2026-04-03T00:00:00.000Z",
    });
    expect(response.json()).toEqual({
      id: "plan_1",
      clientId: null,
      userId: "user_1",
      accountId: "acc_1",
      categoryId: null,
      type: "EXPENSE",
      title: "Internet bill",
      notes: null,
      amount: "1699.00",
      currency: "PHP",
      startDate: "2026-04-01T00:00:00.000Z",
      recurrence: "MONTHLY",
      semiMonthlyDays: [],
      isActive: true,
      nextOccurrenceAt: "2026-05-01T00:00:00.000Z",
      lastProcessedAt: "2026-04-03T00:00:00.000Z",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-04-03T00:00:00.000Z",
      deletedAt: null,
      clientUpdatedAt: null,
    });
  });
});
