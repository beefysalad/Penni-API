import { z } from "zod";

export const healthResponseSchema = z.object({
  ok: z.boolean(),
  database: z.enum(["up", "down"]),
});

export const healthRouteSchema = {
  response: {
    200: healthResponseSchema,
  },
};
