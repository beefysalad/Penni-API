import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const verifyClerkSessionToken = vi.fn();
const listCategories = vi.fn();
const createCategory = vi.fn();

vi.mock("../src/lib/clerk.js", () => ({
  ClerkLib: {
    verifyClerkSessionToken,
    getClerkUserById: vi.fn(),
  },
  clerkClient: {},
}));

vi.mock("../src/services/category.services.js", () => ({
  categoryService: {
    listCategories,
    createCategory,
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

describe("categories", () => {
  let app: Awaited<ReturnType<typeof import("../src/bootstrap.js")["buildServer"]>>;

  beforeAll(async () => {
    const { buildServer } = await import("../src/bootstrap.js");
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns the current user's categories", async () => {
    verifyClerkSessionToken.mockResolvedValue({
      sub: "user_clerk_123",
      sid: "sess_123",
    });

    listCategories.mockResolvedValue([
      {
        id: "cat_1",
        clientId: null,
        userId: "user_1",
        name: "Food",
        slug: "food",
        type: "EXPENSE",
        icon: "utensils",
        colorHex: "#8BFF62",
        isDefault: true,
        createdAt: new Date("2026-03-27T00:00:00.000Z"),
        updatedAt: new Date("2026-03-27T00:00:00.000Z"),
        deletedAt: null,
        clientUpdatedAt: null,
      },
    ]);

    const response = await app.inject({
      method: "GET",
      url: "/api/categories?type=EXPENSE",
      headers: {
        authorization: "Bearer valid-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(listCategories).toHaveBeenCalledWith("user_clerk_123", "EXPENSE");
    expect(response.json()).toEqual([
      {
        id: "cat_1",
        clientId: null,
        userId: "user_1",
        name: "Food",
        slug: "food",
        type: "EXPENSE",
        icon: "utensils",
        colorHex: "#8BFF62",
        isDefault: true,
        createdAt: "2026-03-27T00:00:00.000Z",
        updatedAt: "2026-03-27T00:00:00.000Z",
        deletedAt: null,
        clientUpdatedAt: null,
      },
    ]);
  });

  it("creates a category", async () => {
    verifyClerkSessionToken.mockResolvedValue({
      sub: "user_clerk_123",
      sid: "sess_123",
    });

    createCategory.mockResolvedValue({
      id: "cat_2",
      clientId: "client_cat_2",
      userId: "user_1",
      name: "Coffee",
      slug: "coffee",
      type: "EXPENSE",
      icon: "coffee",
      colorHex: "#5AA9FF",
      isDefault: false,
      createdAt: new Date("2026-03-27T00:00:00.000Z"),
      updatedAt: new Date("2026-03-27T00:00:00.000Z"),
      deletedAt: null,
      clientUpdatedAt: null,
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/categories",
      headers: {
        authorization: "Bearer valid-token",
      },
      payload: {
        clientId: "client_cat_2",
        name: "Coffee",
        slug: "coffee",
        type: "EXPENSE",
        icon: "coffee",
        colorHex: "#5AA9FF",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(createCategory).toHaveBeenCalledWith("user_clerk_123", {
      clientId: "client_cat_2",
      name: "Coffee",
      slug: "coffee",
      type: "EXPENSE",
      icon: "coffee",
      colorHex: "#5AA9FF",
    });
  });
});
