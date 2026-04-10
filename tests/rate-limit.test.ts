import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "../src/index.js";

describe("rate limiting", () => {
  const app = buildServer({
    rateLimit: {
      max: 2,
      timeWindowMs: 60_000,
      skip: () => false,
    },
  });

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 429 after the request limit is exceeded", async () => {
    const firstResponse = await app.inject({
      method: "GET",
      url: "/api/health",
      remoteAddress: "203.0.113.10",
    });

    const secondResponse = await app.inject({
      method: "GET",
      url: "/api/health",
      remoteAddress: "203.0.113.10",
    });

    const thirdResponse = await app.inject({
      method: "GET",
      url: "/api/health",
      remoteAddress: "203.0.113.10",
    });

    expect(firstResponse.statusCode).toBe(200);
    expect(secondResponse.statusCode).toBe(200);
    expect(thirdResponse.statusCode).toBe(429);
    expect(thirdResponse.json()).toEqual({
      error: {
        message: "Too many requests",
      },
    });
    expect(thirdResponse.headers["retry-after"]).toBeDefined();
  });
});
