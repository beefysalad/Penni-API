import { categoryRepository } from "../repository/category.repository.js";
import type {
  CreateCategoryBody,
  UpdateCategoryBody,
} from "../schemas/category.schema.js";
import { userService } from "./user.services.js";

const DEFAULT_CATEGORIES = [
  { name: "Food", slug: "food", type: "EXPENSE", colorHex: "#8BFF62", icon: "utensils" },
  { name: "Bills", slug: "bills", type: "EXPENSE", colorHex: "#5AA9FF", icon: "receipt" },
  {
    name: "Transport",
    slug: "transport",
    type: "EXPENSE",
    colorHex: "#41D6B2",
    icon: "car-front",
  },
  { name: "Shopping", slug: "shopping", type: "EXPENSE", colorHex: "#FFC857", icon: "shopping-bag" },
  { name: "Salary", slug: "salary", type: "INCOME", colorHex: "#8BFF62", icon: "wallet" },
  { name: "Allowance", slug: "allowance", type: "INCOME", colorHex: "#D8FF5B", icon: "coins" },
] as const;

export const categoryService = {
  listCategories: async (clerkUserId: string, type?: "EXPENSE" | "INCOME") => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    await categoryRepository.createManyDefaultCategories(
      user.id,
      DEFAULT_CATEGORIES.map((category) => ({
        userId: user.id,
        ...category,
        isDefault: true,
      })),
    );

    return categoryRepository.listCategoriesByUserId(user.id, type);
  },

  createCategory: async (
    clerkUserId: string,
    input: CreateCategoryBody,
  ) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return categoryRepository.createCategory({
      userId: user.id,
      name: input.name,
      slug: input.slug,
      type: input.type,
      ...(input.clientId ? { clientId: input.clientId } : {}),
      ...(input.icon ? { icon: input.icon } : {}),
      ...(input.colorHex ? { colorHex: input.colorHex } : {}),
      ...(input.clientUpdatedAt
        ? { clientUpdatedAt: input.clientUpdatedAt }
        : {}),
    });
  },

  updateCategory: async (
    clerkUserId: string,
    categoryId: string,
    input: UpdateCategoryBody,
  ) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return categoryRepository.updateCategory(user.id, categoryId, {
      ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.colorHex !== undefined ? { colorHex: input.colorHex } : {}),
      ...(input.clientUpdatedAt !== undefined
        ? { clientUpdatedAt: input.clientUpdatedAt }
        : {}),
    });
  },

  deleteCategory: async (clerkUserId: string, categoryId: string) => {
    const user = await userService.ensureCurrentUser(clerkUserId);

    return categoryRepository.softDeleteCategory(user.id, categoryId);
  },
};
