import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./unread-count_GET.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    schema.parse(queryParams); // Validate empty object

    const result = await db
      .selectFrom("notifications")
      .select(db.fn.count("id").as("count"))
      .where("userId", "=", user.id)
      .where("isRead", "=", false)
      .executeTakeFirstOrThrow();

    const output: OutputType = {
      count: Number(result.count),
    };

    return new Response(superjson.stringify(output));
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}