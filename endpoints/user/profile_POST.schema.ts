import { z } from "zod";
import superjson from "superjson";
import { User } from "../../helpers/User";

// Schema for updating user profile. All fields are optional.
// The user can update their display name and avatar.
// Style preferences are not included as they are not in the DB schema.
export const schema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").optional(),
  avatarUrl: z.string().url("Invalid URL format for avatar").nullable().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  user: User;
};

export const postProfile = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/user/profile`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse(await result.text()) as { error?: string };
    throw new Error(errorObject.error || "Failed to update profile");
  }
  return superjson.parse<OutputType>(await result.text());
};