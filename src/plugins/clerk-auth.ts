import fp from "fastify-plugin";
import { AppError } from "../errors/app-error.js";
import { verifyClerkSessionToken } from "../lib/clerk.js";

export const clerkAuthPlugin = fp(async (fastify) => {
  fastify.decorateRequest("auth", null);

  fastify.decorate("authenticate", async (request) => {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401);
    }

    const token = authorizationHeader.replace("Bearer ", "").trim();

    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    const payload = await verifyClerkSessionToken(token);

    if (!payload.sub) {
      throw new AppError("Unauthorized", 401);
    }

    request.auth = {
      clerkUserId: payload.sub,
      sessionId: typeof payload.sid === "string" ? payload.sid : null,
    };
  });
});
