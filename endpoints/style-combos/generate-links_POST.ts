import { schema, OutputType, GeneratedItemSchema } from "./generate-links_POST.schema";
import superjson from 'superjson';
import OpenAI from 'openai';
import { AMAZON_ASSOCIATE_TAG } from '../../helpers/_publicConfigs';
import { postRateLimiter } from "../../helpers/rateLimiter";
import { addSecurityHeaders, createSafeErrorResponse, applyRateLimiting } from "../../helpers/security";
import { handleNetworkError, getAbortSignalWithTimeout, REQUEST_TIMEOUT_MS } from "../../helpers/networkDefaults";
import { addAffiliateTag, isAffiliateConfigured } from "../../helpers/affiliate";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set.");
}

if (!isAffiliateConfigured()) {
    console.warn("AMAZON_ASSOCIATE_TAG is not configured. Affiliate links will not be monetized.");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

function constructPrompt(description: string, title?: string, season?: string, style?: string): string {
  // Handle unconfigured affiliate tag
  const associateTag = isAffiliateConfigured() 
    ? AMAZON_ASSOCIATE_TAG 
    : 'your-affiliate-tag-20'; // Generic placeholder when not configured
  
  let prompt = `You are an expert fashion stylist for an AI-powered recommendation app called GlamScan. Your task is to generate a list of clothing and accessory items that create a complete outfit based on the user's request.

User's Request:
- Title: ${title || 'Not provided'}
- Description: ${description}
- Season: ${season || 'Any'}
- Style: ${style || 'Any'}

Instructions:
1.  Analyze the user's request to understand the desired outfit.
2.  Generate a list of 3 to 5 items that form a cohesive and stylish outfit combo.
3.  For each item, provide the following details in a JSON object:
    -   "name": A descriptive and appealing product name (e.g., "Vintage High-Waisted Denim Shorts").
    -   "price": A realistic estimated price in USD (numeric value, e.g., 49.99).
    -   "imageUrl": A placeholder image URL. Use "https://via.placeholder.com/300" for all items.
    -   "affiliateUrl": A correctly formatted Amazon search URL that will lead users to a search results page for the item.${
      isAffiliateConfigured() 
        ? ` The URL must include the affiliate tag.`
        : ` Note: Affiliate functionality is not configured.`
    }
        -   Base URL: https://www.amazon.com/s
        -   Search Query Parameter: k=<your generated search keywords>${
      isAffiliateConfigured() 
        ? `\n        -   Affiliate Tag Parameter: tag=${associateTag}`
        : ``
    }
        -   Example for "black leather jacket": https://www.amazon.com/s?k=black+leather+jacket${
      isAffiliateConfigured() 
        ? `&tag=${associateTag}` 
        : ``
    }

Output Format:
Your final output must be a single, valid JSON object with a key "items" which contains an array of the generated item objects. Do not include any other text, explanations, or markdown formatting.

Example Output:
{
  "items": [
    {
      "name": "Classic White Cotton T-Shirt",
      "price": 24.99,
      "imageUrl": "https://via.placeholder.com/300",
      "affiliateUrl": "https://www.amazon.com/s?k=classic+white+cotton+t-shirt${
      isAffiliateConfigured() 
        ? `&tag=${associateTag}` 
        : ``
    }"
    },
    {
      "name": "Distressed Light-Wash Denim Jeans",
      "price": 79.50,
      "imageUrl": "https://via.placeholder.com/300",
      "affiliateUrl": "https://www.amazon.com/s?k=distressed+light-wash+denim+jeans${
      isAffiliateConfigured() 
        ? `&tag=${associateTag}` 
        : ``
    }"
    }
  ]
}`;

  return prompt;
}

export async function handle(request: Request) {
  try {
    // Apply rate limiting for generation endpoints (more restrictive)
    await applyRateLimiting(request, postRateLimiter);

    const json = superjson.parse(await request.text());
    const { description, title, season, style } = schema.parse(json);

    const prompt = constructPrompt(description, title, season, style);

    console.log("Sending prompt to OpenAI for style combo generation...");

    // Use AbortSignal for timeout handling
    const signal = getAbortSignalWithTimeout(REQUEST_TIMEOUT_MS);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      console.error("OpenAI returned an empty response.");
      return addSecurityHeaders(createSafeErrorResponse(
        new Error("OpenAI returned empty response"),
        "Failed to generate links: AI returned no content",
        500
      ));
    }

    const parsedJson = JSON.parse(aiResponse);
    
    // The AI is instructed to return { "items": [...] }, so we validate that structure.
    const validationResult = GeneratedItemSchema.array().safeParse(parsedJson.items);

    if (!validationResult.success) {
        console.error("OpenAI response validation failed:", validationResult.error);
        return addSecurityHeaders(createSafeErrorResponse(
          validationResult.error,
          "Failed to generate links: AI returned invalid data format",
          500
        ));
    }

    // Ensure all URLs have proper affiliate tags for monetization
    const output: OutputType = validationResult.data.map(item => ({
      ...item,
      affiliateUrl: addAffiliateTag(item.affiliateUrl),
    }));

    // Add warning header if affiliate links are not configured
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!isAffiliateConfigured()) {
      headers['X-Affiliate-Warning'] = 'Affiliate links are not configured and will not be monetized';
    }

    const jsonResponse = new Response(superjson.stringify(output), { headers });
    return addSecurityHeaders(jsonResponse);

  } catch (error) {
    // Handle rate limiting responses
    if (error instanceof Response) {
      return addSecurityHeaders(error);
    }

    handleNetworkError(error, "Style combo generation");
    
    if (error instanceof Error) {
      return addSecurityHeaders(createSafeErrorResponse(
        error,
        "Failed to generate style combo links",
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