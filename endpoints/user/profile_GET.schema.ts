import { z } from "zod";
import superjson from "superjson";
import { User } from "../../helpers/User";

// No input schema needed for a GET request fetching the current user's profile.
export const schema = z.object({});

// The output type should reflect the user's public profile information.
// We omit sensitive fields like 'role'.
export type OutputType = Pick<User, 'id' | 'email' | 'displayName' | 'avatarUrl'>;

export const getProfile = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/user/profile`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse(await result.text()) as { error?: string };
    throw new Error(errorObject.error || "Failed to fetch profile");
  }
  return superjson.parse<OutputType>(await result.text());
};