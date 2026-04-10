import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors/app-error.js";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitPluginOptions = {
  max: number;
  timeWindowMs: number;
  skip?: (request: FastifyRequest) => boolean;
};

function getClientKey(request: FastifyRequest) {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
    return forwardedFor.split(",")[0]?.trim() || request.ip;
  }

  const realIp = request.headers["x-real-ip"];

  if (typeof realIp === "string" && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return request.ip;
}

function setRateLimitHeaders(
  reply: FastifyReply,
  max: number,
  remaining: number,
  resetAt: number,
) {
  reply.header("x-ratelimit-limit", String(max));
  reply.header("x-ratelimit-remaining", String(Math.max(remaining, 0)));
  reply.header("x-ratelimit-reset", String(Math.ceil(resetAt / 1000)));
}

export function defaultRateLimitSkip(request: FastifyRequest) {
  return (
    request.url.startsWith("/api/health") ||
    request.url.startsWith("/api/docs")
  );
}

async function rateLimitPluginImpl(
  app: FastifyRequest["server"],
  options: RateLimitPluginOptions,
) {
  const store = new Map<string, RateLimitEntry>();
  const cleanupIntervalMs = Math.max(options.timeWindowMs, 1_000);

  const cleanupTimer = setInterval(() => {
    const now = Date.now();

    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, cleanupIntervalMs);

  cleanupTimer.unref();

  app.addHook("onRequest", async (request, reply) => {
    if (options.skip?.(request)) {
      return;
    }

    const now = Date.now();
    const key = getClientKey(request);
    const existingEntry = store.get(key);

    const entry =
      existingEntry && existingEntry.resetAt > now
        ? existingEntry
        : {
            count: 0,
            resetAt: now + options.timeWindowMs,
          };

    entry.count += 1;
    store.set(key, entry);

    setRateLimitHeaders(reply, options.max, options.max - entry.count, entry.resetAt);

    if (entry.count > options.max) {
      reply.header(
        "retry-after",
        String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))),
      );

      throw new AppError("Too many requests", 429);
    }
  });

  app.addHook("onClose", async () => {
    clearInterval(cleanupTimer);
    store.clear();
  });
}

export const rateLimitPlugin = fp(rateLimitPluginImpl);
