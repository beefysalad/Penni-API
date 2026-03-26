import { AppHelper } from "../helpers/helper.js";
import { ClerkLib } from "../lib/clerk.js";
import { userRepository } from "../repository/user.repository.js";

export const userService = {
  syncUser: async (clerkUserId: string) => {
    const clerkUser = await ClerkLib.getClerkUserById(clerkUserId);

    return userRepository.upsertUser({
      clerkId: clerkUser.id,
      email: AppHelper._getPrimaryEmailAddress(clerkUser),
      firstName: AppHelper._normalizeName(clerkUser.firstName),
      lastName: AppHelper._normalizeName(clerkUser.lastName),
    });
  },
};
