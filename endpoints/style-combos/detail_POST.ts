import { db } from "../../helpers/db";
import { schema, OutputType, StyleComboWithItems } from "./detail_POST.schema";
import superjson from "superjson";
import { Selectable } from "kysely";
import { StyleComboItems } from "../../helpers/schema";
import { generalRateLimiter } from "../../helpers/rateLimiter";
import { addSecurityHeaders, createSafeErrorResponse, applyRateLimiting } from "../../helpers/security";
import { handleNetworkError } from "../../helpers/networkDefaults";
import { addAffiliateTag } from "../../helpers/affiliate";

export async function handle(request: Request) {
  try {
    // Apply rate limiting
    await applyRateLimiting(request, generalRateLimiter);

    const json = superjson.parse(await request.text());
    const { id } = schema.parse(json);

    const combo = await db
      .selectFrom("styleCombos")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!combo) {
      return addSecurityHeaders(createSafeErrorResponse(
        new Error("Style combo not found"),
        "Style combo not found",
        404
      ));
    }

    const items = await db
      .selectFrom("styleComboItems")
      .selectAll()
      .where("comboId", "=", id)
      .orderBy("itemOrder", "asc")
      .execute();

    // Sanitize URLs with affiliate tags for monetization
    const response: OutputType = {
      styleCombo: {
        ...combo,
        shopUrl: addAffiliateTag(combo.shopUrl),
        totalPrice: Number(combo.totalPrice), // Convert numeric string back to number
        items: items.map((item) => ({
          ...item,
          price: Number(item.price), // Convert numeric string back to number
          affiliateUrl: addAffiliateTag(item.affiliateUrl), // Ensure affiliate monetization
        })),
      },
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

    handleNetworkError(error, "Style combo detail");
    
    if (error instanceof Error) {
      return addSecurityHeaders(createSafeErrorResponse(
        error,
        "Failed to fetch style combo details",
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