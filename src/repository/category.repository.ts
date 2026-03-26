import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";

export type CreateCategoryInput = {
  userId: string;
  clientId?: string;
  name: string;
  slug: string;
  type: "EXPENSE" | "INCOME";
  icon?: string;
  colorHex?: string;
  isDefault?: boolean;
  clientUpdatedAt?: string;
};

export type UpdateCategoryInput = Partial<Omit<CreateCategoryInput, "userId">>;

export const categoryRepository = {
  listCategoriesByUserId: async (userId: string, type?: "EXPENSE" | "INCOME") => {
    return prisma.category.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(type ? { type } : {}),
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          name: "asc",
        },
      ],
    });
  },

  createCategory: async (input: CreateCategoryInput) => {
    return prisma.category.create({
      data: {
        userId: input.userId,
        name: input.name,
        slug: input.slug,
        type: input.type,
        isDefault: input.isDefault ?? false,
        ...(input.clientId ? { clientId: input.clientId } : {}),
        ...(input.icon ? { icon: input.icon } : {}),
        ...(input.colorHex ? { colorHex: input.colorHex } : {}),
        ...(input.clientUpdatedAt
          ? { clientUpdatedAt: new Date(input.clientUpdatedAt) }
          : {}),
      },
    });
  },

  createManyDefaultCategories: async (userId: string, input: CreateCategoryInput[]) => {
    await prisma.category.createMany({
      data: input.map((item) => ({
        userId,
        name: item.name,
        slug: item.slug,
        type: item.type,
        isDefault: item.isDefault ?? true,
        ...(item.clientId ? { clientId: item.clientId } : {}),
        ...(item.icon ? { icon: item.icon } : {}),
        ...(item.colorHex ? { colorHex: item.colorHex } : {}),
        ...(item.clientUpdatedAt
          ? { clientUpdatedAt: new Date(item.clientUpdatedAt) }
          : {}),
      })),
      skipDuplicates: true,
    });
  },

  getCategoryById: async (userId: string, categoryId: string) => {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    return category;
  },

  updateCategory: async (userId: string, categoryId: string, input: UpdateCategoryInput) => {
    await categoryRepository.getCategoryById(userId, categoryId);

    return prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.colorHex !== undefined ? { colorHex: input.colorHex } : {}),
        ...(input.clientUpdatedAt !== undefined
          ? { clientUpdatedAt: new Date(input.clientUpdatedAt) }
          : {}),
      },
    });
  },

  softDeleteCategory: async (userId: string, categoryId: string) => {
    await categoryRepository.getCategoryById(userId, categoryId);

    return prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  },
};
