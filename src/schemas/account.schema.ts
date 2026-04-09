import { z } from "zod";

const accountTypeSchema = z.enum([
  "CASH",
  "BANK_ACCOUNT",
  "E_WALLET",
  "CREDIT_CARD",
  "OTHER",
]);

const dateTimeSchema = z.string().datetime();

function validateCreditCardFields(
  value: {
    type?: "CASH" | "BANK_ACCOUNT" | "E_WALLET" | "CREDIT_CARD" | "OTHER" | undefined;
    creditCard?:
      | {
          creditLimit?: string | undefined;
          availableCredit?: string | undefined;
          dueDayOfMonth?: number | undefined;
          statementDayOfMonth?: number | undefined;
        }
      | undefined;
  },
  ctx: z.RefinementCtx,
  requireAllFields: boolean,
) {
  if (value.type !== "CREDIT_CARD") {
    return;
  }

  if (requireAllFields && !value.creditCard?.creditLimit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["creditCard", "creditLimit"],
      message: "Credit limit is required for credit cards",
    });
  }

  if (requireAllFields && !value.creditCard?.availableCredit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["creditCard", "availableCredit"],
      message: "Available credit is required for credit cards",
    });
  }

  if (requireAllFields && !value.creditCard?.dueDayOfMonth) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["creditCard", "dueDayOfMonth"],
      message: "Due day is required for credit cards",
    });
  }

  if (value.creditCard?.creditLimit && value.creditCard?.availableCredit) {
    const creditLimit = Number(value.creditCard.creditLimit);
    const availableCredit = Number(value.creditCard.availableCredit);

    if (availableCredit > creditLimit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["creditCard", "availableCredit"],
        message: "Available credit cannot be higher than the total limit",
      });
    }
  }
}

export const accountResponseSchema = z.object({
  id: z.string(),
  clientId: z.string().nullable(),
  userId: z.string(),
  name: z.string(),
  type: accountTypeSchema,
  currency: z.string(),
  balance: z.string(),
  institutionName: z.string().nullable(),
  creditCard: z
    .object({
      creditLimit: z.string(),
      availableCredit: z.string(),
      dueDayOfMonth: z.number().int().min(1).max(31),
      statementDayOfMonth: z.number().int().min(1).max(31).nullable(),
    })
    .nullable(),
  isArchived: z.boolean(),
  lastSyncedAt: dateTimeSchema.nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  deletedAt: dateTimeSchema.nullable(),
  clientUpdatedAt: dateTimeSchema.nullable(),
});

const accountBodyBaseSchema = z.object({
  clientId: z.string().min(1).optional(),
  name: z.string().min(1).max(120),
  type: accountTypeSchema,
  currency: z.string().min(3).max(3).default("PHP"),
  balance: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  creditCard: z
    .object({
      creditLimit: z.string().regex(/^-?\d+(\.\d{1,2})?$/).optional(),
      availableCredit: z.string().regex(/^-?\d+(\.\d{1,2})?$/).optional(),
      dueDayOfMonth: z.number().int().min(1).max(31).optional(),
      statementDayOfMonth: z.number().int().min(1).max(31).optional(),
    })
    .optional(),
  institutionName: z.string().min(1).max(120).optional(),
  clientUpdatedAt: z.string().datetime().optional(),
});

export const createAccountBodySchema = accountBodyBaseSchema.superRefine((value, ctx) => {
  validateCreditCardFields(value, ctx, true);
});

export const updateAccountBodySchema = accountBodyBaseSchema
  .partial()
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field must be provided",
      });
    }

    validateCreditCardFields(value as Parameters<typeof validateCreditCardFields>[0], ctx, false);
  });

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
