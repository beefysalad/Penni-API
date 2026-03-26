import { prisma } from "../lib/prisma.js";

export type UpsertUserFromClerkInput = {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
};

export const userRepository = {
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
};
