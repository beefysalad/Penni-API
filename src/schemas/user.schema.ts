import { z } from "zod";

export const userResponseSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const meRouteSchema = {
  tags: ["User"],
  security: [{ bearerAuth: [] }],
  response: {
    200: userResponseSchema,
  },
};
