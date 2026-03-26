import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

export const AppHelper = {
  _serializeDate: (value: Date | string) => {
    return value instanceof Date
      ? value.toISOString()
      : new Date(value).toISOString();
  },
  _normalizeName: (name: string | null) => {
    return name?.trim() ?? "";
  },
  _getPrimaryEmailAddress: (
    clerkUser: {
      primaryEmailAddressId: string | null;
      emailAddresses: Array<{
        id: string;
        emailAddress: string;
      }>;
    },
  ) => {
    if (clerkUser.primaryEmailAddressId) {
      const primaryEmailAddress = clerkUser.emailAddresses.find(
        (emailAddress: { id: string }) =>
          emailAddress.id === clerkUser.primaryEmailAddressId,
      );

      if (primaryEmailAddress?.emailAddress) {
        return primaryEmailAddress.emailAddress;
      }
    }

    const fallbackEmailAddress = clerkUser.emailAddresses[0]?.emailAddress;

    if (fallbackEmailAddress) {
      return fallbackEmailAddress;
    }

    throw new AppError("Clerk user is missing a primary email address.", 422);
  },
  _getClerkSecretKey: () => {
    if (!env.clerkSecretKey) {
      throw new AppError("Clerk server authentication is not configured.", 500);
    }

    return env.clerkSecretKey;
  },
};
