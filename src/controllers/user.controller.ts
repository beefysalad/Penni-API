import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors/app-error.js";
import { userService } from "../services/user.services.js";
import { AppHelper } from "../helpers/helper.js";

export const userController = {
  me: async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await userService.syncUser(request.auth.clerkUserId);

    return {
      ...user,
      createdAt: AppHelper._serializeDate(user.createdAt),
      updatedAt: AppHelper._serializeDate(user.updatedAt),
    };
  },
};
