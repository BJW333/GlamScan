import { db } from "../../helpers/db";
import { schema, OutputType } from "./update_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";
import { Transaction } from "kysely";
import { DB } from "../../helpers/schema";
import { postRateLimiter } from "../../helpers/rateLimiter";
import { addSecurityHeaders, createSafeErrorResponse, applyRateLimiting, authorize } from "../../helpers/security";
import { handleNetworkError } from "../../helpers/networkDefaults";
import { addAffiliateTag } from "../../helpers/affiliate";

async function updateStyleComboWithItems(
  trx: Transaction<DB>,
  input: import("./update_POST.schema").InputType
): Promise<void> {
  const { id: comboId, items, ...comboData } = input;

  // Sanitize URLs with affiliate tags
  const sanitizedComboData = {
    ...comboData,
    shopUrl: addAffiliateTag(comboData.shopUrl),
    totalPrice: String(comboData.totalPrice), // Ensure totalPrice is a string for numeric type
    updatedAt: new Date(),
  };

  // 1. Update the style combo details
  const updateResult = await trx
    .updateTable("styleCombos")
    .set(sanitizedComboData)
    .where("id", "=", comboId)
    .executeTakeFirst();

  if (updateResult.numUpdatedRows === 0n) {
    throw new Error(`Style combo with ID ${comboId} not found.`);
  }

  // 2. Delete all existing items for this combo
  await trx.deleteFrom("styleComboItems").where("comboId", "=", comboId).execute();

  // 3. Insert the new set of items with affiliate URL sanitization
  if (items && items.length > 0) {
    const itemInserts = items.map((item, index) => ({
      comboId: comboId,
      name: item.name,
      price: String(item.price), // Ensure price is a string for numeric type
      imageUrl: item.imageUrl,
      affiliateUrl: addAffiliateTag(item.affiliateUrl), // Ensure affiliate monetization
      itemOrder: item.itemOrder ?? index + 1,
    }));

    await trx.insertInto("styleComboItems").values(itemInserts).execute();
  }
}

export async function handle(request: Request) {
  try {
    // Apply rate limiting for POST endpoints
    await applyRateLimiting(request, postRateLimiter);

    const { user } = await getServerUserSession(request);
    
    // Verify user exists and has admin permissions
    authorize(user, ["admin"]);

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    await db.transaction().execute(async (trx) => {
      await updateStyleComboWithItems(trx, input);
    });

    const response: OutputType = {
      success: true,
      styleComboId: input.id,
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

    handleNetworkError(error, "Style combo update");
    
    if (error instanceof Error) {
      return addSecurityHeaders(createSafeErrorResponse(
        error,
        "Failed to update style combo",
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