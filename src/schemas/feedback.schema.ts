import { z } from "zod";

const dateTimeSchema = z.string().datetime();

export const feedbackTypeSchema = z.enum([
  "BUG_REPORT",
  "GENERAL_FEEDBACK",
  "FEATURE_REQUEST",
  "SHOW_SOME_LOVE",
]);

export const moodSchema = z.enum([
  "FRUSTRATED",
  "UNHAPPY",
  "NEUTRAL",
  "HAPPY",
  "LOVING_IT",
]);

export const feedbackResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  feedbackType: feedbackTypeSchema,
  message: z.string(),
  mood: moodSchema,
  email: z.string().email().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createFeedbackBodySchema = z.object({
  feedbackType: feedbackTypeSchema,
  message: z.string().trim().min(1).max(1000),
  mood: moodSchema,
  email: z.string().email().optional(),
});

export const listFeedbackRouteSchema = {
  tags: ["Feedback"],
  security: [{ bearerAuth: [] }],
  response: {
    200: z.array(feedbackResponseSchema),
  },
};

export const createFeedbackRouteSchema = {
  tags: ["Feedback"],
  security: [{ bearerAuth: [] }],
  body: createFeedbackBodySchema,
  response: {
    201: feedbackResponseSchema,
  },
};

export type CreateFeedbackBody = z.infer<typeof createFeedbackBodySchema>;
