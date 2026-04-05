import { beforeEach, describe, expect, it, vi } from "vitest";

const ensureCurrentUser = vi.fn();
const getAccountById = vi.fn();
const createTransfer = vi.fn();
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

vi.mock("../src/repository/transaction.repository.js", () => ({
  transactionRepository: {
    createTransfer,
    createTransaction,
    listTransactionsByUserId: vi.fn(),
    getTransactionSummary: vi.fn(),
    getTransactionById: vi.fn(),
    updateTransaction: vi.fn(),
    softDeleteTransaction: vi.fn(),
  },
}));

describe("transactionService.createTransfer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureCurrentUser.mockResolvedValue({ id: "user_1" });
  });

  it("rejects credit cards as transfer sources", async () => {
    getAccountById
      .mockResolvedValueOnce({
        id: "acc_cc",
        userId: "user_1",
        type: "CREDIT_CARD",
        currency: "PHP",
      })
      .mockResolvedValueOnce({
        id: "acc_cash",
        userId: "user_1",
        type: "CASH",
        currency: "PHP",
      });

    const { transactionService } = await import("../src/services/transaction.services.js");

    await expect(
      transactionService.createTransfer("clerk_123", {
        fromAccountId: "acc_cc",
        toAccountId: "acc_cash",
        amount: "500.00",
        transactionAt: "2026-04-03T02:30:00.000Z",
      }),
    ).rejects.toMatchObject({
      message: "Transfers from credit cards are not supported yet",
      statusCode: 422,
    });

    expect(createTransfer).not.toHaveBeenCalled();
  });
});

describe("transactionService.createTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureCurrentUser.mockResolvedValue({ id: "user_1" });
  });

  it("rejects credit card charges above available credit", async () => {
    getAccountById.mockResolvedValue({
      id: "acc_cc",
      userId: "user_1",
      type: "CREDIT_CARD",
      currency: "PHP",
      availableCredit: "0.00",
    });

    const { transactionService } = await import("../src/services/transaction.services.js");

    await expect(
      transactionService.createTransaction("clerk_123", {
        accountId: "acc_cc",
        type: "EXPENSE",
        source: "MANUAL",
        title: "Over limit charge",
        amount: "500.00",
        currency: "PHP",
        transactionAt: "2026-04-05T02:30:00.000Z",
      }),
    ).rejects.toMatchObject({
      message: "Charge exceeds the card's available credit",
      statusCode: 422,
    });

    expect(createTransaction).not.toHaveBeenCalled();
  });

  it("rejects asset account expenses above available balance", async () => {
    getAccountById.mockResolvedValue({
      id: "acc_cash",
      userId: "user_1",
      type: "CASH",
      currency: "PHP",
      balance: "250.00",
    });

    const { transactionService } = await import("../src/services/transaction.services.js");

    await expect(
      transactionService.createTransaction("clerk_123", {
        accountId: "acc_cash",
        type: "EXPENSE",
        source: "MANUAL",
        title: "Too big",
        amount: "2500.00",
        currency: "PHP",
        transactionAt: "2026-04-05T02:30:00.000Z",
      }),
    ).rejects.toMatchObject({
      message: "Amount exceeds the account's available balance",
      statusCode: 422,
    });

    expect(createTransaction).not.toHaveBeenCalled();
  });
});
