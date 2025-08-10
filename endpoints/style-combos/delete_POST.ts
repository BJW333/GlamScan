import { db } from "../../helpers/db";
import { schema, OutputType } from "./delete_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";
import { postRateLimiter } from "../../helpers/rateLimiter";
import { addSecurityHeaders, createSafeErrorResponse, applyRateLimiting, authorize } from "../../helpers/security";
import { handleNetworkError } from "../../helpers/networkDefaults";

export async function handle(request: Request) {
  try {
    // Apply rate limiting for POST endpoints
    await applyRateLimiting(request, postRateLimiter);

    const { user } = await getServerUserSession(request);
    
    // Verify user exists and has admin permissions
    authorize(user, ["admin"]);

    const json = superjson.parse(await request.text());
    const { id } = schema.parse(json);

    const result = await db.transaction().execute(async (trx) => {
      // First, delete associated items. This is good practice even if CASCADE is on.
      await trx.deleteFrom("styleComboItems").where("comboId", "=", id).execute();

      // Then, delete the style combo itself.
      const deleteResult = await trx
        .deleteFrom("styleCombos")
        .where("id", "=", id)
        .executeTakeFirst();

      return deleteResult;
    });

    if (result.numDeletedRows === 0n) {
      return addSecurityHeaders(createSafeErrorResponse(
        new Error(`Style combo with ID ${id} not found`),
        `Style combo with ID ${id} not found`,
        404
      ));
    }

    const response: OutputType = {
      success: true,
      message: `Style combo with ID ${id} deleted successfully.`,
    };

    const jsonResponse = new Response(superjson.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    return addSecurityHeaders(jsonResponse);
  } catch (error) {
    // Handle rate limiting responses
    if (error instanceof Response) {
      return addSecurityHeaders(error);
    }

    handleNetworkError(error, "Style combo deletion");
    
    if (error instanceof Error) {
      return addSecurityHeaders(createSafeErrorResponse(
        error,
        "Failed to delete style combo",
        400
      ));
    }
    
    return addSecurityHeaders(createSafeErrorResponse(
      error,
      "Internal server error",
      500
    ));
  }
}