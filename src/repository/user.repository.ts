import { prisma } from "../lib/prisma.js";

export type UpsertUserFromClerkInput = {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
};

export const userRepository = {
  findUserByClerkId: async (clerkId: string) => {
    return prisma.user.findUnique({
      where: {
        clerkId,
      },
    });
  },

  upsertUser: async (input: UpsertUserFromClerkInput) => {
    return prisma.user.upsert({
      where: {
        clerkId: input.clerkId,
      },
      create: input,
      update: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });
  },

  updateOnboarded: async (clerkId: string, onboarded: boolean) => {
    return prisma.user.update({
      where: {
        clerkId,
      },
      data: {
        onboarded,
      },
    });
  },
};
