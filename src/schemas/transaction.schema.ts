import { z } from "zod";

const transactionTypeSchema = z.enum(["EXPENSE", "INCOME"]);
const transactionSourceSchema = z.enum(["MANUAL", "RECURRING", "IMPORTED"]);
const dateTimeSchema = z.string().datetime();

export const transactionResponseSchema = z.object({
  id: z.string(),
  clientId: z.string().nullable(),
  userId: z.string(),
  accountId: z.string().nullable(),
  categoryId: z.string().nullable(),
  plannedItemId: z.string().nullable(),
  type: transactionTypeSchema,
  source: transactionSourceSchema,
  title: z.string(),
  notes: z.string().nullable(),
  amount: z.string(),
  currency: z.string(),
  transactionAt: dateTimeSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  deletedAt: dateTimeSchema.nullable(),
  clientUpdatedAt: dateTimeSchema.nullable(),
});

export const createTransactionBodySchema = z.object({
  clientId: z.string().min(1).optional(),
  accountId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  plannedItemId: z.string().min(1).optional(),
  type: transactionTypeSchema,
  source: transactionSourceSchema.default("MANUAL"),
  title: z.string().min(1).max(160),
  notes: z.string().max(2000).optional(),
  amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  currency: z.string().min(3).max(3).default("PHP"),
  transactionAt: z.string().datetime(),
  clientUpdatedAt: z.string().datetime().optional(),
});

export const updateTransactionBodySchema = createTransactionBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const transactionParamsSchema = z.object({
  id: z.string().min(1),
});

export const listTransactionsQuerySchema = z.object({
  type: transactionTypeSchema.optional(),
  accountId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const listTransactionsRouteSchema = {
  tags: ["Transaction"],
  security: [{ bearerAuth: [] }],
  querystring: listTransactionsQuerySchema,
  response: {
    200: z.array(transactionResponseSchema),
  },
};

export const createTransactionRouteSchema = {
  tags: ["Transaction"],
  security: [{ bearerAuth: [] }],
  body: createTransactionBodySchema,
  response: {
    201: transactionResponseSchema,
  },
};

export const updateTransactionRouteSchema = {
  tags: ["Transaction"],
  security: [{ bearerAuth: [] }],
  params: transactionParamsSchema,
  body: updateTransactionBodySchema,
  response: {
    200: transactionResponseSchema,
  },
};

export const deleteTransactionRouteSchema = {
  tags: ["Transaction"],
  security: [{ bearerAuth: [] }],
  params: transactionParamsSchema,
  response: {
    200: transactionResponseSchema,
  },
};

export type CreateTransactionBody = z.infer<typeof createTransactionBodySchema>;
export type UpdateTransactionBody = z.infer<typeof updateTransactionBodySchema>;
export type TransactionParams = z.infer<typeof transactionParamsSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
