import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const verifyClerkSessionToken = vi.fn();
const syncCurrentUser = vi.fn();

vi.mock("../src/lib/clerk.js", () => ({
  verifyClerkSessionToken,
  getClerkUserById: vi.fn(),
  clerkClient: {},
}));

vi.mock("../src/services/user.services.js", () => ({
  userService: {
    syncCurrentUser,
  },
}));

describe("me", () => {
  let app: Awaited<ReturnType<typeof import("../src/app.js")["buildServer"]>>;

  beforeAll(async () => {
    const { buildServer } = await import("../src/app.js");
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

    syncCurrentUser.mockResolvedValue({
      id: "user_1",
      clerkId: "user_clerk_123",
      firstName: "Pat",
      lastName: "Zephyr",
      email: "pat@example.com",
      createdAt: new Date("2026-03-26T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-03-26T00:00:00.000Z").toISOString(),
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
    expect(syncCurrentUser).toHaveBeenCalledWith("user_clerk_123");
    expect(response.json()).toEqual({
      id: "user_1",
      clerkId: "user_clerk_123",
      firstName: "Pat",
      lastName: "Zephyr",
      email: "pat@example.com",
      createdAt: "2026-03-26T00:00:00.000Z",
      updatedAt: "2026-03-26T00:00:00.000Z",
    });
  });
});
