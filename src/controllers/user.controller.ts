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

    return userController._serializeUser(user);
  },

  updateOnboarding: async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const body = request.body as { onboarded: boolean };
    const user = await userService.updateOnboarding(request.auth.clerkUserId, body.onboarded);

    return userController._serializeUser(user);
  },

  _serializeUser: (user: {
    id: string;
    clerkId: string;
    firstName: string;
    lastName: string;
    email: string;
    onboarded: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) => ({
    id: user.id,
    clerkId: user.clerkId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    onboarded: user.onboarded,
    createdAt: AppHelper._serializeDate(user.createdAt),
    updatedAt: AppHelper._serializeDate(user.updatedAt),
  }),
};
