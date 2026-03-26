import { z } from "zod";

const transactionTypeSchema = z.enum(["EXPENSE", "INCOME"]);
const dateTimeSchema = z.string().datetime();

export const categoryResponseSchema = z.object({
  id: z.string(),
  clientId: z.string().nullable(),
  userId: z.string(),
  name: z.string(),
  slug: z.string(),
  type: transactionTypeSchema,
  icon: z.string().nullable(),
  colorHex: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  deletedAt: dateTimeSchema.nullable(),
  clientUpdatedAt: dateTimeSchema.nullable(),
});

export const listCategoriesQuerySchema = z.object({
  type: transactionTypeSchema.optional(),
});

export const createCategoryBodySchema = z.object({
  clientId: z.string().min(1).optional(),
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80),
  type: transactionTypeSchema,
  icon: z.string().min(1).max(80).optional(),
  colorHex: z.string().regex(/^#([A-Fa-f0-9]{6})$/).optional(),
  clientUpdatedAt: z.string().datetime().optional(),
});

export const updateCategoryBodySchema = createCategoryBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field must be provided",
  },
);

export const categoryParamsSchema = z.object({
  id: z.string().min(1),
});

export const listCategoriesRouteSchema = {
  tags: ["Category"],
  security: [{ bearerAuth: [] }],
  querystring: listCategoriesQuerySchema,
  response: {
    200: z.array(categoryResponseSchema),
  },
};

export const createCategoryRouteSchema = {
  tags: ["Category"],
  security: [{ bearerAuth: [] }],
  body: createCategoryBodySchema,
  response: {
    201: categoryResponseSchema,
  },
};

export const updateCategoryRouteSchema = {
  tags: ["Category"],
  security: [{ bearerAuth: [] }],
  params: categoryParamsSchema,
  body: updateCategoryBodySchema,
  response: {
    200: categoryResponseSchema,
  },
};

export const deleteCategoryRouteSchema = {
  tags: ["Category"],
  security: [{ bearerAuth: [] }],
  params: categoryParamsSchema,
  response: {
    200: categoryResponseSchema,
  },
};

export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategoryBodySchema>;
export type CategoryParams = z.infer<typeof categoryParamsSchema>;
