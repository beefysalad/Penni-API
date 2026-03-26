import { z } from "zod";

const dateTimeSchema = z.string().datetime();

export const budgetResponseSchema = z.object({
  id: z.string(),
  clientId: z.string().nullable(),
  userId: z.string(),
  categoryId: z.string().nullable(),
  name: z.string().nullable(),
  amount: z.string(),
  currency: z.string(),
  alertThreshold: z.number(),
  periodStart: dateTimeSchema,
  periodEnd: dateTimeSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  deletedAt: dateTimeSchema.nullable(),
  clientUpdatedAt: dateTimeSchema.nullable(),
});

export const createBudgetBodySchema = z.object({
  clientId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  name: z.string().min(1).max(120).optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().min(3).max(3).default("PHP"),
  alertThreshold: z.number().int().min(1).max(100).default(80),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  clientUpdatedAt: z.string().datetime().optional(),
});

export const updateBudgetBodySchema = createBudgetBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field must be provided",
  },
);

export const budgetParamsSchema = z.object({
  id: z.string().min(1),
});

export const listBudgetsRouteSchema = {
  tags: ["Budget"],
  security: [{ bearerAuth: [] }],
  response: {
    200: z.array(budgetResponseSchema),
  },
};

export const createBudgetRouteSchema = {
  tags: ["Budget"],
  security: [{ bearerAuth: [] }],
  body: createBudgetBodySchema,
  response: {
    201: budgetResponseSchema,
  },
};

export const updateBudgetRouteSchema = {
  tags: ["Budget"],
  security: [{ bearerAuth: [] }],
  params: budgetParamsSchema,
  body: updateBudgetBodySchema,
  response: {
    200: budgetResponseSchema,
  },
};

export const deleteBudgetRouteSchema = {
  tags: ["Budget"],
  security: [{ bearerAuth: [] }],
  params: budgetParamsSchema,
  response: {
    200: budgetResponseSchema,
  },
};

export type CreateBudgetBody = z.infer<typeof createBudgetBodySchema>;
export type UpdateBudgetBody = z.infer<typeof updateBudgetBodySchema>;
export type BudgetParams = z.infer<typeof budgetParamsSchema>;
