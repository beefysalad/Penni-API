import { AppHelper } from "../helpers/helper.js";
import { ClerkLib } from "../lib/clerk.js";
import { userRepository } from "../repository/user.repository.js";

export const userService = {
  ensureCurrentUser: async (clerkUserId: string) => {
    const existingUser = await userRepository.findUserByClerkId(clerkUserId);

    if (existingUser) {
      return existingUser;
    }

    return userService.syncUser(clerkUserId);
  },

  syncUser: async (clerkUserId: string) => {
    const clerkUser = await ClerkLib.getClerkUserById(clerkUserId);

    return userRepository.upsertUser({
      clerkId: clerkUser.id,
      email: AppHelper._getPrimaryEmailAddress(clerkUser),
      firstName: AppHelper._normalizeName(clerkUser.firstName),
      lastName: AppHelper._normalizeName(clerkUser.lastName),
    });
  },

  updateOnboarding: async (clerkUserId: string, onboarded: boolean) => {
    await userService.ensureCurrentUser(clerkUserId);

    return userRepository.updateOnboarded(clerkUserId, onboarded);
  },
};
