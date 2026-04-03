import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const verifyClerkSessionToken = vi.fn();
const syncUser = vi.fn();

vi.mock("../src/lib/clerk.js", () => ({
  ClerkLib: {
    verifyClerkSessionToken,
    getClerkUserById: vi.fn(),
  },
  clerkClient: {},
}));

vi.mock("../src/services/user.services.js", () => ({
  userService: {
    syncUser,
  },
}));

describe("me", () => {
  let app: Awaited<ReturnType<typeof import("../src/bootstrap.js")["buildServer"]>>;

  beforeAll(async () => {
    const { buildServer } = await import("../src/bootstrap.js");
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 401 when the bearer token is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/me",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: "Unauthorized",
      message: "Unauthorized",
      statusCode: 401,
    });
  });

  it("returns the synced backend user for a valid clerk token", async () => {
    verifyClerkSessionToken.mockResolvedValue({
      sub: "user_clerk_123",
      sid: "sess_123",
    });

    syncUser.mockResolvedValue({
      id: "user_1",
      clerkId: "user_clerk_123",
      firstName: "Pat",
      lastName: "Zephyr",
      email: "pat@example.com",
      onboarded: false,
      createdAt: new Date("2026-03-26T00:00:00.000Z"),
      updatedAt: new Date("2026-03-26T00:00:00.000Z"),
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: {
        authorization: "Bearer valid-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(verifyClerkSessionToken).toHaveBeenCalledWith("valid-token");
    expect(syncUser).toHaveBeenCalledWith("user_clerk_123");
    expect(response.json()).toEqual({
      id: "user_1",
      clerkId: "user_clerk_123",
      firstName: "Pat",
      lastName: "Zephyr",
      email: "pat@example.com",
      onboarded: false,
      createdAt: "2026-03-26T00:00:00.000Z",
      updatedAt: "2026-03-26T00:00:00.000Z",
    });
  });
});
