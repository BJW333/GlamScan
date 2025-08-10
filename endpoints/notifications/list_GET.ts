import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const { limit, page, type, isRead } = schema.parse(queryParams);
    const offset = (page - 1) * limit;

    let query = db
      .selectFrom("notifications")
      .where("notifications.userId", "=", user.id);

    if (type) {
      query = query.where("notifications.type", "=", type);
    }
    if (isRead !== undefined) {
      query = query.where("notifications.isRead", "=", isRead);
    }

    const notifications = await query
      .selectAll()
      .orderBy("notifications.createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    const { count } = await query
      .select(db.fn.count("notifications.id").as("count"))
      .executeTakeFirstOrThrow();

    const totalCount = Number(count);
    const totalPages = Math.ceil(totalCount / limit);

    const output: OutputType = {
      notifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    };

    return new Response(superjson.stringify(output));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}