import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const verifyClerkSessionToken = vi.fn();
const listAccounts = vi.fn();
const createAccount = vi.fn();
const deleteAccount = vi.fn();

vi.mock("../src/lib/clerk.js", () => ({
  ClerkLib: {
    verifyClerkSessionToken,
    getClerkUserById: vi.fn(),
  },
  clerkClient: {},
}));

vi.mock("../src/services/account.services.js", () => ({
  accountService: {
    listAccounts,
    createAccount,
    updateAccount: vi.fn(),
    deleteAccount,
  },
}));

describe("accounts", () => {
  let app: Awaited<ReturnType<typeof import("../src/index.js")["buildServer"]>>;

  beforeAll(async () => {
    const { buildServer } = await import("../src/index.js");
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns the current user's accounts", async () => {
    verifyClerkSessionToken.mockResolvedValue({
      sub: "user_clerk_123",
      sid: "sess_123",
    });

    listAccounts.mockResolvedValue([
      {
        id: "acc_1",
        clientId: null,
        userId: "user_1",
        name: "GCash",
        type: "E_WALLET",
        currency: "PHP",
        balance: {
          toString: () => "6420.00",
        },
        institutionName: null,
        isArchived: false,
        lastSyncedAt: null,
        createdAt: new Date("2026-03-27T00:00:00.000Z"),
        updatedAt: new Date("2026-03-27T00:00:00.000Z"),
        deletedAt: null,
        clientUpdatedAt: null,
      },
    ]);

    const response = await app.inject({
      method: "GET",
      url: "/api/accounts",
      headers: {
        authorization: "Bearer valid-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(listAccounts).toHaveBeenCalledWith("user_clerk_123");
    expect(response.json()).toEqual([
      {
        id: "acc_1",
        clientId: null,
        userId: "user_1",
        name: "GCash",
        type: "E_WALLET",
        currency: "PHP",
        balance: "6420.00",
        creditLimit: null,
        availableCredit: null,
        dueDayOfMonth: null,
        institutionName: null,
        isArchived: false,
        lastSyncedAt: null,
        createdAt: "2026-03-27T00:00:00.000Z",
        updatedAt: "2026-03-27T00:00:00.000Z",
        deletedAt: null,
        clientUpdatedAt: null,
      },
    ]);
  });

  it("creates an account", async () => {
    verifyClerkSessionToken.mockResolvedValue({
      sub: "user_clerk_123",
      sid: "sess_123",
    });

    createAccount.mockResolvedValue({
      id: "acc_2",
      clientId: "client_acc_2",
      userId: "user_1",
      name: "BPI Savings",
      type: "BANK_ACCOUNT",
      currency: "PHP",
      balance: {
        toString: () => "1000.00",
      },
      institutionName: "BPI",
      isArchived: false,
      lastSyncedAt: null,
      createdAt: new Date("2026-03-27T00:00:00.000Z"),
      updatedAt: new Date("2026-03-27T00:00:00.000Z"),
      deletedAt: null,
      clientUpdatedAt: null,
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/accounts",
      headers: {
        authorization: "Bearer valid-token",
      },
      payload: {
        clientId: "client_acc_2",
        name: "BPI Savings",
        type: "BANK_ACCOUNT",
        currency: "PHP",
        balance: "1000.00",
        institutionName: "BPI",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(createAccount).toHaveBeenCalledWith("user_clerk_123", {
      clientId: "client_acc_2",
      name: "BPI Savings",
      type: "BANK_ACCOUNT",
      currency: "PHP",
      balance: "1000.00",
      institutionName: "BPI",
    });
  });

  it("deletes an account", async () => {
    verifyClerkSessionToken.mockResolvedValue({
      sub: "user_clerk_123",
      sid: "sess_123",
    });

    deleteAccount.mockResolvedValue({
      id: "acc_2",
      clientId: "client_acc_2",
      userId: "user_1",
      name: "BPI Savings",
      type: "BANK_ACCOUNT",
      currency: "PHP",
      balance: {
        toString: () => "1000.00",
      },
      creditLimit: null,
      availableCredit: null,
      dueDayOfMonth: null,
      institutionName: "BPI",
      isArchived: true,
      lastSyncedAt: null,
      createdAt: new Date("2026-03-27T00:00:00.000Z"),
      updatedAt: new Date("2026-04-03T00:00:00.000Z"),
      deletedAt: new Date("2026-04-03T00:00:00.000Z"),
      clientUpdatedAt: null,
    });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/accounts/acc_2",
      headers: {
        authorization: "Bearer valid-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(deleteAccount).toHaveBeenCalledWith("user_clerk_123", "acc_2");
    expect(response.json()).toEqual({
      id: "acc_2",
      clientId: "client_acc_2",
      userId: "user_1",
      name: "BPI Savings",
      type: "BANK_ACCOUNT",
      currency: "PHP",
      balance: "1000.00",
      creditLimit: null,
      availableCredit: null,
      dueDayOfMonth: null,
      institutionName: "BPI",
      isArchived: true,
      lastSyncedAt: null,
      createdAt: "2026-03-27T00:00:00.000Z",
      updatedAt: "2026-04-03T00:00:00.000Z",
      deletedAt: "2026-04-03T00:00:00.000Z",
      clientUpdatedAt: null,
    });
  });
});
