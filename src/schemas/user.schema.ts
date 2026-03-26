import { z } from "zod";

export const userResponseSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  onboarded: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const updateOnboardingBodySchema = z.object({
  onboarded: z.boolean(),
});

export const meRouteSchema = {
  tags: ["User"],
  security: [{ bearerAuth: [] }],
  response: {
    200: userResponseSchema,
  },
};

export const updateOnboardingRouteSchema = {
  tags: ["User"],
  security: [{ bearerAuth: [] }],
  body: updateOnboardingBodySchema,
  response: {
    200: userResponseSchema,
  },
};
