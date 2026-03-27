import { z } from "zod";

const transactionTypeSchema = z.enum(["EXPENSE", "INCOME"]);
const recurrenceFrequencySchema = z.enum(["WEEKLY", "MONTHLY", "SEMI_MONTHLY", "QUARTERLY", "YEARLY"]);
const dateTimeSchema = z.string().datetime();

export const plannedItemResponseSchema = z.object({
  id: z.string(),
  clientId: z.string().nullable(),
  userId: z.string(),
  accountId: z.string().nullable(),
  categoryId: z.string().nullable(),
  type: transactionTypeSchema,
  title: z.string(),
  notes: z.string().nullable(),
  amount: z.string(),
  currency: z.string(),
  startDate: dateTimeSchema,
  recurrence: recurrenceFrequencySchema,
  semiMonthlyDays: z.array(z.number().int().min(1).max(31)),
  isActive: z.boolean(),
  nextOccurrenceAt: dateTimeSchema.nullable(),
  lastProcessedAt: dateTimeSchema.nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  deletedAt: dateTimeSchema.nullable(),
  clientUpdatedAt: dateTimeSchema.nullable(),
});

const basePlannedItemBodySchema = z.object({
  clientId: z.string().min(1).optional(),
  accountId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  type: transactionTypeSchema,
  title: z.string().min(1).max(160),
  notes: z.string().max(2000).optional(),
  amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  currency: z.string().min(3).max(3).default("PHP"),
  startDate: z.string().datetime(),
  recurrence: recurrenceFrequencySchema,
  semiMonthlyDays: z.array(z.number().int().min(1).max(31)).max(2).optional(),
  isActive: z.boolean().optional(),
  nextOccurrenceAt: z.string().datetime().optional(),
  lastProcessedAt: z.string().datetime().optional(),
  clientUpdatedAt: z.string().datetime().optional(),
});

function hasValidSemiMonthlyDays(value?: number[]) {
  if (!value || value.length !== 2) return false;
  return new Set(value).size === 2;
}

export const createPlannedItemBodySchema = basePlannedItemBodySchema.superRefine((value, ctx) => {
  if (value.recurrence === "SEMI_MONTHLY" && !hasValidSemiMonthlyDays(value.semiMonthlyDays)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["semiMonthlyDays"],
      message: "Semi-monthly items need exactly two different payout days.",
    });
  }

  if (value.type === "INCOME" && !value.accountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["accountId"],
      message: "Income recurring items need an account.",
    });
  }
});

export const updatePlannedItemBodySchema = basePlannedItemBodySchema
  .partial()
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field must be provided",
      });
    }

    if (value.recurrence === "SEMI_MONTHLY" && !hasValidSemiMonthlyDays(value.semiMonthlyDays)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["semiMonthlyDays"],
        message: "Semi-monthly items need exactly two different payout days.",
      });
    }

    if (value.type === "INCOME" && value.accountId !== undefined && !value.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["accountId"],
        message: "Income recurring items need an account.",
      });
    }
  });

export const plannedItemParamsSchema = z.object({
  id: z.string().min(1),
});

export const listPlannedItemsQuerySchema = z.object({
  type: transactionTypeSchema.optional(),
  accountId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const listPlannedItemsRouteSchema = {
  tags: ["PlannedItem"],
  security: [{ bearerAuth: [] }],
  querystring: listPlannedItemsQuerySchema,
  response: {
    200: z.array(plannedItemResponseSchema),
  },
};

export const createPlannedItemRouteSchema = {
  tags: ["PlannedItem"],
  security: [{ bearerAuth: [] }],
  body: createPlannedItemBodySchema,
  response: {
    201: plannedItemResponseSchema,
  },
};

export const updatePlannedItemRouteSchema = {
  tags: ["PlannedItem"],
  security: [{ bearerAuth: [] }],
  params: plannedItemParamsSchema,
  body: updatePlannedItemBodySchema,
  response: {
    200: plannedItemResponseSchema,
  },
};

export const deletePlannedItemRouteSchema = {
  tags: ["PlannedItem"],
  security: [{ bearerAuth: [] }],
  params: plannedItemParamsSchema,
  response: {
    200: plannedItemResponseSchema,
  },
};

export type CreatePlannedItemBody = z.infer<typeof createPlannedItemBodySchema>;
export type UpdatePlannedItemBody = z.infer<typeof updatePlannedItemBodySchema>;
export type PlannedItemParams = z.infer<typeof plannedItemParamsSchema>;
export type ListPlannedItemsQuery = z.infer<typeof listPlannedItemsQuerySchema>;
