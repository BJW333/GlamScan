import { db } from "../../helpers/db";
import { schema, OutputType } from "./create_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";
import { Transaction } from "kysely";
import { DB } from "../../helpers/schema";
import { postRateLimiter } from "../../helpers/rateLimiter";
import { addSecurityHeaders, createSafeErrorResponse, applyRateLimiting, authorize } from "../../helpers/security";
import { handleNetworkError } from "../../helpers/networkDefaults";
import { addAffiliateTag } from "../../helpers/affiliate";
import { StyleComboItemSchema } from "../../helpers/styleComboSchema";

async function createStyleComboWithItems(
  trx: Transaction<DB>,
  input: import("./create_POST.schema").InputType
): Promise<number> {
  const { items, ...comboData } = input;

  // Sanitize URLs with affiliate tags
  const sanitizedComboData = {
    ...comboData,
    shopUrl: addAffiliateTag(comboData.shopUrl),
    totalPrice: String(comboData.totalPrice), // Ensure totalPrice is a string for numeric type
  };

  const [newCombo] = await trx
    .insertInto("styleCombos")
    .values(sanitizedComboData)
    .returning("id")
    .execute();

  if (!newCombo || !newCombo.id) {
    throw new Error("Failed to create style combo.");
  }

  const comboId = newCombo.id;

  if (items && items.length > 0) {
    // Validate each item against the schema and sanitize URLs
    const validatedItems = items.map(item => {
      const validated = StyleComboItemSchema.parse(item);
      return {
        ...validated,
        affiliateUrl: addAffiliateTag(validated.affiliateUrl),
      };
    });
    
    const itemInserts = validatedItems.map((item, index) => ({
      comboId: comboId,
      name: item.name,
      price: String(item.price), // Ensure price is a string for numeric type
      imageUrl: item.imageUrl,
      affiliateUrl: item.affiliateUrl,
      itemOrder: item.itemOrder ?? index + 1,
    }));

    await trx.insertInto("styleComboItems").values(itemInserts).execute();
  }

  return comboId;
}

export async function handle(request: Request) {
  try {
    // Apply rate limiting for POST endpoints
    await applyRateLimiting(request, postRateLimiter);

    const { user } = await getServerUserSession(request);
    
    // Verify user exists and has proper permissions
    if (!user || !user.id) {
      return addSecurityHeaders(createSafeErrorResponse(
        new Error("Authentication required"),
        "Authentication required",
        401
      ));
    }
    
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Authorization and validation based on user role
    if (user.role !== "admin") {
      // Regular users can only create style combos from AI-generated outfits
      // Validate that all items have affiliate URLs (indicating AI generation)
      const itemsWithoutAffiliateUrl = input.items.filter(item => !item.affiliateUrl);
      if (itemsWithoutAffiliateUrl.length > 0) {
        return addSecurityHeaders(createSafeErrorResponse(
          new Error("Regular users can only create style combos from AI-generated outfits"),
          "Regular users can only create style combos from AI-generated outfits. All items must have affiliate URLs.",
          403
        ));
      }

      // Regular users cannot create sponsored content
      if (input.isSponsored) {
        return addSecurityHeaders(createSafeErrorResponse(
          new Error("Regular users cannot create sponsored content"),
          "Regular users cannot create sponsored content. Only admin users can create sponsored style combos.",
          403
        ));
      }
    }

    const comboId = await db.transaction().execute(async (trx) => {
      return createStyleComboWithItems(trx, input);
    });

    const response: OutputType = {
      success: true,
      styleComboId: comboId,
    };

    const jsonResponse = new Response(superjson.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

    return addSecurityHeaders(jsonResponse);
  } catch (error) {
    // Handle rate limiting responses
    if (error instanceof Response) {
      return addSecurityHeaders(error);
    }

    handleNetworkError(error, "Style combo creation");
    
    if (error instanceof Error) {
      return addSecurityHeaders(createSafeErrorResponse(
        error,
        "Failed to create style combo",
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