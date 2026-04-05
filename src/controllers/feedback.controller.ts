import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors/app-error.js";
import { AppHelper } from "../helpers/helper.js";
import { feedbackService } from "../services/feedback.services.js";
import type { CreateFeedbackBody } from "../schemas/feedback.schema.js";

function serializeFeedback(feedback: Awaited<ReturnType<typeof feedbackService.createFeedback>>) {
  return {
    ...feedback,
    email: feedback.email ?? null,
    createdAt: AppHelper._serializeDate(feedback.createdAt),
    updatedAt: AppHelper._serializeDate(feedback.updatedAt),
  };
}

export const feedbackController = {
  listFeedback: async (request: FastifyRequest) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const feedback = await feedbackService.listFeedback(request.auth.clerkUserId);
    return feedback.map(serializeFeedback);
  },

  createFeedback: async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth?.clerkUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const feedback = await feedbackService.createFeedback(
      request.auth.clerkUserId,
      request.body as CreateFeedbackBody,
    );

    return reply.status(201).send(serializeFeedback(feedback));
  },
};
