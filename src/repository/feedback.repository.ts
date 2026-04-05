import { prisma } from "../lib/prisma.js";

export type CreateFeedbackInput = {
  userId: string;
  feedbackType: "BUG_REPORT" | "GENERAL_FEEDBACK" | "FEATURE_REQUEST" | "SHOW_SOME_LOVE";
  message: string;
  mood: "FRUSTRATED" | "UNHAPPY" | "NEUTRAL" | "HAPPY" | "LOVING_IT";
  email?: string;
};

export const feedbackRepository = {
  listFeedbackByUserId: async (userId: string) => {
    return prisma.feedBack.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  createFeedback: async (input: CreateFeedbackInput) => {
    return prisma.feedBack.create({
      data: {
        userId: input.userId,
        feedbackType: input.feedbackType,
        message: input.message,
        mood: input.mood,
        ...(input.email ? { email: input.email } : {}),
      },
    });
  },
};
