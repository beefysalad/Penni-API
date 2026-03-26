import { z } from "zod";

const accountTypeSchema = z.enum([
  "CASH",
  "BANK_ACCOUNT",
  "E_WALLET",
  "CREDIT_CARD",
  "OTHER",
]);

const dateTimeSchema = z.string().datetime();

export const accountResponseSchema = z.object({
  id: z.string(),
  clientId: z.string().nullable(),
  userId: z.string(),
  name: z.string(),
  type: accountTypeSchema,
  currency: z.string(),
  balance: z.string(),
  institutionName: z.string().nullable(),
  isArchived: z.boolean(),
  lastSyncedAt: dateTimeSchema.nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  deletedAt: dateTimeSchema.nullable(),
  clientUpdatedAt: dateTimeSchema.nullable(),
});

export const createAccountBodySchema = z.object({
  clientId: z.string().min(1).optional(),
  name: z.string().min(1).max(120),
  type: accountTypeSchema,
  currency: z.string().min(3).max(3).default("PHP"),
  balance: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  institutionName: z.string().min(1).max(120).optional(),
  clientUpdatedAt: z.string().datetime().optional(),
});

export const updateAccountBodySchema = createAccountBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field must be provided",
  },
);

export const accountParamsSchema = z.object({
  id: z.string().min(1),
});

export const listAccountsRouteSchema = {
  tags: ["Account"],
  security: [{ bearerAuth: [] }],
  response: {
    200: z.array(accountResponseSchema),
  },
};

export const createAccountRouteSchema = {
  tags: ["Account"],
  security: [{ bearerAuth: [] }],
  body: createAccountBodySchema,
  response: {
    201: accountResponseSchema,
  },
};

export const updateAccountRouteSchema = {
  tags: ["Account"],
  security: [{ bearerAuth: [] }],
  params: accountParamsSchema,
  body: updateAccountBodySchema,
  response: {
    200: accountResponseSchema,
  },
};

export const deleteAccountRouteSchema = {
  tags: ["Account"],
  security: [{ bearerAuth: [] }],
  params: accountParamsSchema,
  response: {
    200: accountResponseSchema,
  },
};

export type CreateAccountBody = z.infer<typeof createAccountBodySchema>;
export type UpdateAccountBody = z.infer<typeof updateAccountBodySchema>;
export type AccountParams = z.infer<typeof accountParamsSchema>;
