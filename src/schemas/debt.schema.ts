import { z } from "zod";

const dateTimeSchema = z.string().datetime();

export const debtDirectionSchema = z.enum(["I_OWE", "OWED_TO_ME"]);
export const debtStatusSchema = z.enum(["OPEN", "SETTLED"]);

const amountStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid positive number");

export const debtResponseSchema = z.object({
  id: z.string(),
  clientId: z.string().nullable(),
  userId: z.string(),
  direction: debtDirectionSchema,
  status: debtStatusSchema,
  title: z.string(),
  counterpartyName: z.string(),
  notes: z.string().nullable(),
  originalAmount: z.string(),
  currentBalance: z.string(),
  currency: z.string(),
  dueDate: dateTimeSchema.nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  deletedAt: dateTimeSchema.nullable(),
  clientUpdatedAt: dateTimeSchema.nullable(),
});

export const createDebtBodySchema = z
  .object({
    clientId: z.string().min(1).optional(),
    direction: debtDirectionSchema,
    title: z.string().trim().min(1).max(120),
    counterpartyName: z.string().trim().min(1).max(120),
    notes: z.string().trim().max(1000).optional(),
    originalAmount: amountStringSchema,
    currentBalance: amountStringSchema.optional(),
    currency: z.string().trim().min(3).max(3).default("PHP"),
    dueDate: dateTimeSchema.optional(),
    clientUpdatedAt: dateTimeSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const originalAmount = Number(value.originalAmount);
    const currentBalance = Number(value.currentBalance ?? value.originalAmount);

    if (currentBalance > originalAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentBalance"],
        message: "Current balance cannot be higher than the original amount.",
      });
    }
  });

export const debtParamsSchema = z.object({
  id: z.string().min(1),
});

export const listDebtsRouteSchema = {
  tags: ["Debt"],
  security: [{ bearerAuth: [] }],
  response: {
    200: z.array(debtResponseSchema),
  },
};

export const createDebtRouteSchema = {
  tags: ["Debt"],
  security: [{ bearerAuth: [] }],
  body: createDebtBodySchema,
  response: {
    201: debtResponseSchema,
  },
};

export const deleteDebtRouteSchema = {
  tags: ["Debt"],
  security: [{ bearerAuth: [] }],
  params: debtParamsSchema,
  response: {
    200: debtResponseSchema,
  },
};

export type CreateDebtBody = z.infer<typeof createDebtBodySchema>;
export type DebtParams = z.infer<typeof debtParamsSchema>;
