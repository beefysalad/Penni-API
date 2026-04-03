import { beforeEach, describe, expect, it, vi } from "vitest";

const ensureCurrentUser = vi.fn();
const getAccountById = vi.fn();
const createTransfer = vi.fn();

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
    listTransactionsByUserId: vi.fn(),
    getTransactionSummary: vi.fn(),
    createTransaction: vi.fn(),
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
