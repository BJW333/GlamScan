import { getServerUserSession } from "../../helpers/getServerUserSession";
import { OutputType } from "./profile_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    // The user object from getServerUserSession contains all the necessary profile info.
    // If style preferences were stored in the DB, we would query them here.
    // For now, we return the available data.
    const profileData: OutputType = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };

    return new Response(superjson.stringify(profileData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 401, // Unauthorized or session expired
      headers: { "Content-Type": "application/json" },
    });
  }
}