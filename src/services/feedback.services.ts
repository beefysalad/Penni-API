import { feedbackRepository } from "../repository/feedback.repository.js";
import type { CreateFeedbackBody } from "../schemas/feedback.schema.js";
import { userService } from "./user.services.js";

export const feedbackService = {
  listFeedback: async (clerkUserId: string) => {
    const user = await userService.ensureCurrentUser(clerkUserId);
    return feedbackRepository.listFeedbackByUserId(user.id);
  },

  createFeedback: async (clerkUserId: string, input: CreateFeedbackBody) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return feedbackRepository.createFeedback({
      userId: user.id,
      feedbackType: input.feedbackType,
      message: input.message,
      mood: input.mood,
      ...(input.email ? { email: input.email } : {}),
    });
  },
};
