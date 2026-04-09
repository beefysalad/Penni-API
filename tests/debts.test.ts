import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const verifyClerkSessionToken = vi.fn();
const listDebts = vi.fn();
const createDebt = vi.fn();
const deleteDebt = vi.fn();

vi.mock("../src/lib/clerk.js", () => ({
  ClerkLib: {
    verifyClerkSessionToken,
    getClerkUserById: vi.fn(),
  },
  clerkClient: {},
}));

vi.mock("../src/services/debt.services.js", () => ({
  debtService: {
    listDebts,
    createDebt,
    deleteDebt,
  },
}));

describe("debts", () => {
  let app: Awaited<ReturnType<typeof import("../src/index.js")["buildServer"]>>;

  beforeAll(async () => {
    const { buildServer } = await import("../src/index.js");
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns the current user's debts", async () => {
    verifyClerkSessionToken.mockResolvedValue({
      sub: "user_clerk_123",
      sid: "sess_123",
    });

    listDebts.mockResolvedValue([
      {
        id: "debt_1",
        clientId: null,
        userId: "user_1",
        direction: "I_OWE",
        status: "OPEN",
        title: "Laptop advance",
        counterpartyName: "John",
        notes: null,
        originalAmount: { toString: () => "10000.00" },
        currentBalance: { toString: () => "10000.00" },
        currency: "PHP",
        dueDate: new Date("2026-05-01T00:00:00.000Z"),
        createdAt: new Date("2026-04-09T08:00:00.000Z"),
        updatedAt: new Date("2026-04-09T08:00:00.000Z"),
        deletedAt: null,
        clientUpdatedAt: null,
      },
    ]);

    const response = await app.inject({
      method: "GET",
      url: "/api/debts",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(listDebts).toHaveBeenCalledWith("user_clerk_123");
  });

  it("creates a debt", async () => {
    verifyClerkSessionToken.mockResolvedValue({
      sub: "user_clerk_123",
      sid: "sess_123",
    });

    createDebt.mockResolvedValue({
      id: "debt_2",
      clientId: null,
      userId: "user_1",
      direction: "OWED_TO_ME",
      status: "OPEN",
      title: "Borrowed cash",
      counterpartyName: "Sarah",
      notes: null,
      originalAmount: { toString: () => "500.00" },
      currentBalance: { toString: () => "500.00" },
      currency: "PHP",
      dueDate: null,
      createdAt: new Date("2026-04-09T08:30:00.000Z"),
      updatedAt: new Date("2026-04-09T08:30:00.000Z"),
      deletedAt: null,
      clientUpdatedAt: null,
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/debts",
      headers: { authorization: "Bearer valid-token" },
      payload: {
        direction: "OWED_TO_ME",
        title: "Borrowed cash",
        counterpartyName: "Sarah",
        originalAmount: "500.00",
        currency: "PHP",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(createDebt).toHaveBeenCalledWith("user_clerk_123", {
      direction: "OWED_TO_ME",
      title: "Borrowed cash",
      counterpartyName: "Sarah",
      originalAmount: "500.00",
      currency: "PHP",
    });
  });
});
