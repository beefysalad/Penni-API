import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const verifyClerkSessionToken = vi.fn();
const listTransactions = vi.fn();
const createTransaction = vi.fn();
const createTransfer = vi.fn();

vi.mock("../src/lib/clerk.js", () => ({
  ClerkLib: {
    verifyClerkSessionToken,
    getClerkUserById: vi.fn(),
  },
  clerkClient: {},
}));

vi.mock("../src/services/transaction.services.js", () => ({
  transactionService: {
    listTransactions,
    createTransaction,
    createTransfer,
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

describe("transactions", () => {
  let app: Awaited<ReturnType<typeof import("../src/bootstrap.js")["buildServer"]>>;

  beforeAll(async () => {
    const { buildServer } = await import("../src/bootstrap.js");
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates a transfer pair", async () => {
    verifyClerkSessionToken.mockResolvedValue({
      sub: "user_clerk_123",
      sid: "sess_123",
    });

    createTransfer.mockResolvedValue({
      outgoingTransaction: {
        id: "txn_out_1",
        clientId: null,
        userId: "user_1",
        accountId: "acc_cash",
        categoryId: null,
        plannedItemId: null,
        type: "EXPENSE",
        source: "TRANSFER",
        title: "ATM cash-out",
        notes: "Card withdrawal",
        amount: { toString: () => "1500.00" },
        currency: "PHP",
        transactionAt: new Date("2026-04-03T02:30:00.000Z"),
        createdAt: new Date("2026-04-03T02:30:00.000Z"),
        updatedAt: new Date("2026-04-03T02:30:00.000Z"),
        deletedAt: null,
        clientUpdatedAt: null,
      },
      incomingTransaction: {
        id: "txn_in_1",
        clientId: null,
        userId: "user_1",
        accountId: "acc_wallet",
        categoryId: null,
        plannedItemId: null,
        type: "INCOME",
        source: "TRANSFER",
        title: "ATM cash-out",
        notes: "Card withdrawal",
        amount: { toString: () => "1500.00" },
        currency: "PHP",
        transactionAt: new Date("2026-04-03T02:30:00.000Z"),
        createdAt: new Date("2026-04-03T02:30:00.000Z"),
        updatedAt: new Date("2026-04-03T02:30:00.000Z"),
        deletedAt: null,
        clientUpdatedAt: null,
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/transactions/transfers",
      headers: {
        authorization: "Bearer valid-token",
      },
      payload: {
        fromAccountId: "acc_cash",
        toAccountId: "acc_wallet",
        title: "ATM cash-out",
        notes: "Card withdrawal",
        amount: "1500.00",
        transactionAt: "2026-04-03T02:30:00.000Z",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(createTransfer).toHaveBeenCalledWith("user_clerk_123", {
      fromAccountId: "acc_cash",
      toAccountId: "acc_wallet",
      title: "ATM cash-out",
      notes: "Card withdrawal",
      amount: "1500.00",
      transactionAt: "2026-04-03T02:30:00.000Z",
    });

    expect(response.json()).toEqual({
      outgoingTransaction: {
        id: "txn_out_1",
        clientId: null,
        userId: "user_1",
        accountId: "acc_cash",
        categoryId: null,
        plannedItemId: null,
        type: "EXPENSE",
        source: "TRANSFER",
        title: "ATM cash-out",
        notes: "Card withdrawal",
        amount: "1500.00",
        currency: "PHP",
        transactionAt: "2026-04-03T02:30:00.000Z",
        createdAt: "2026-04-03T02:30:00.000Z",
        updatedAt: "2026-04-03T02:30:00.000Z",
        deletedAt: null,
        clientUpdatedAt: null,
      },
      incomingTransaction: {
        id: "txn_in_1",
        clientId: null,
        userId: "user_1",
        accountId: "acc_wallet",
        categoryId: null,
        plannedItemId: null,
        type: "INCOME",
        source: "TRANSFER",
        title: "ATM cash-out",
        notes: "Card withdrawal",
        amount: "1500.00",
        currency: "PHP",
        transactionAt: "2026-04-03T02:30:00.000Z",
        createdAt: "2026-04-03T02:30:00.000Z",
        updatedAt: "2026-04-03T02:30:00.000Z",
        deletedAt: null,
        clientUpdatedAt: null,
      },
    });
  });
});
