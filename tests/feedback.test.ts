import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const verifyClerkSessionToken = vi.fn();
const listFeedback = vi.fn();
const createFeedback = vi.fn();

vi.mock("../src/lib/clerk.js", () => ({
  ClerkLib: {
    verifyClerkSessionToken,
    getClerkUserById: vi.fn(),
  },
  clerkClient: {},
}));

vi.mock("../src/services/feedback.services.js", () => ({
  feedbackService: {
    listFeedback,
    createFeedback,
  },
}));

describe("feedback", () => {
  let app: Awaited<ReturnType<typeof import("../src/index.js")["buildServer"]>>;

  beforeAll(async () => {
    const { buildServer } = await import("../src/index.js");
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns the current user's feedback", async () => {
    verifyClerkSessionToken.mockResolvedValue({
      sub: "user_clerk_123",
      sid: "sess_123",
    });

    listFeedback.mockResolvedValue([
      {
        id: "feedback_1",
        userId: "user_1",
        feedbackType: "GENERAL_FEEDBACK",
        message: "This feels clean.",
        mood: "HAPPY",
        email: "john@example.com",
        createdAt: new Date("2026-04-05T08:00:00.000Z"),
        updatedAt: new Date("2026-04-05T08:00:00.000Z"),
      },
    ]);

    const response = await app.inject({
      method: "GET",
      url: "/api/feedback",
      headers: {
        authorization: "Bearer valid-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(listFeedback).toHaveBeenCalledWith("user_clerk_123");
    expect(response.json()).toEqual([
      {
        id: "feedback_1",
        userId: "user_1",
        feedbackType: "GENERAL_FEEDBACK",
        message: "This feels clean.",
        mood: "HAPPY",
        email: "john@example.com",
        createdAt: "2026-04-05T08:00:00.000Z",
        updatedAt: "2026-04-05T08:00:00.000Z",
      },
    ]);
  });

  it("creates feedback", async () => {
    verifyClerkSessionToken.mockResolvedValue({
      sub: "user_clerk_123",
      sid: "sess_123",
    });

    createFeedback.mockResolvedValue({
      id: "feedback_2",
      userId: "user_1",
      feedbackType: "FEATURE_REQUEST",
      message: "Please add more chart detail.",
      mood: "NEUTRAL",
      email: "john@example.com",
      createdAt: new Date("2026-04-05T08:30:00.000Z"),
      updatedAt: new Date("2026-04-05T08:30:00.000Z"),
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/feedback",
      headers: {
        authorization: "Bearer valid-token",
      },
      payload: {
        feedbackType: "FEATURE_REQUEST",
        message: "Please add more chart detail.",
        mood: "NEUTRAL",
        email: "john@example.com",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(createFeedback).toHaveBeenCalledWith("user_clerk_123", {
      feedbackType: "FEATURE_REQUEST",
      message: "Please add more chart detail.",
      mood: "NEUTRAL",
      email: "john@example.com",
    });
    expect(response.json()).toEqual({
      id: "feedback_2",
      userId: "user_1",
      feedbackType: "FEATURE_REQUEST",
      message: "Please add more chart detail.",
      mood: "NEUTRAL",
      email: "john@example.com",
      createdAt: "2026-04-05T08:30:00.000Z",
      updatedAt: "2026-04-05T08:30:00.000Z",
    });
  });
});
