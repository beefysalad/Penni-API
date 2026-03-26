import { AppHelper } from "../helpers/helper.js";
import { getClerkUserById } from "../lib/clerk.js";
import { userRepository } from "../repository/user.repository.js";

export const userService = {
  syncCurrentUser: async (clerkUserId: string) => {
    const clerkUser = await getClerkUserById(clerkUserId);

    return userRepository.upsertUserFromClerk({
      clerkId: clerkUser.id,
      email: AppHelper._getPrimaryEmailAddress(clerkUser),
      firstName: AppHelper._normalizeName(clerkUser.firstName),
      lastName: AppHelper._normalizeName(clerkUser.lastName),
    });
  },
};
