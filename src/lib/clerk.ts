import { createClerkClient, type ClerkClient, verifyToken } from "@clerk/backend";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

function getSecretKey() {
  if (!env.clerkSecretKey) {
    throw new AppError("Clerk server authentication is not configured.", 500);
  }

  return env.clerkSecretKey;
}

export const clerkClient: ClerkClient | null = env.clerkSecretKey
  ? createClerkClient({
      secretKey: env.clerkSecretKey,
    })
  : null;

export async function verifyClerkSessionToken(token: string) {
  try {
    return await verifyToken(token, {
      secretKey: getSecretKey(),
      jwtKey: env.clerkJwtKey,
    });
  } catch (error) {
    console.error("Clerk token verification failed.", error);
    throw new AppError("Unauthorized", 401);
  }
}

export async function getClerkUserById(clerkUserId: string) {
  try {
    if (!clerkClient) {
      throw new AppError("Clerk server authentication is not configured.", 500);
    }

    return await clerkClient.users.getUser(clerkUserId);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Unable to fetch Clerk user.", 502);
  }
}
