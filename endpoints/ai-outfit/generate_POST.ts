import { schema, OutputType, AiOutfitItemSchema } from "./generate_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";
import { OpenAI } from "openai";
import { AMAZON_ASSOCIATE_TAG } from "../../helpers/_publicConfigs";
import { z } from "zod";

/**
 * Generates an AI outfit with affiliate links using OpenAI
 */
async function generateAiOutfit(
  preferences: { occasion?: string; style?: string; budget?: number; gender?: string | null; otherPreferences?: string },
  apiKey: string
): Promise<z.infer<typeof AiOutfitItemSchema>[]> {
  const openai = new OpenAI({ apiKey });

  const prompt = `You are a world-class fashion stylist for an AI-powered fashion app called GlamScan. Create a complete outfit recommendation based on the user's preferences.

User Preferences:
- Occasion: ${preferences.occasion || 'any'}
- Style: ${preferences.style || 'any'}
- Budget: ${preferences.budget ? `Around $${preferences.budget}` : 'not specified'}
- Gender: ${preferences.gender || 'unisex'}
- Other notes: ${preferences.otherPreferences || 'none'}

Create a cohesive outfit with 4-6 items (tops, bottoms, shoes, accessories). For each item, provide:
1. A descriptive name
2. A detailed description explaining why it fits the user's preferences
3. A category (e.g., "Top", "Bottom", "Shoes", "Accessory")
4. A realistic price in USD
5. A high-quality image URL (use placeholder: https://via.placeholder.com/300x300)
6. An Amazon search URL for finding this item

For Amazon URLs, use this format: https://www.amazon.com/s?k=[search+terms]${AMAZON_ASSOCIATE_TAG && AMAZON_ASSOCIATE_TAG !== "none" ? `&tag=${AMAZON_ASSOCIATE_TAG}` : ''}

Respond with a JSON object containing an "outfit" array:
{
  "outfit": [
    {
      "name": "Item Name",
      "description": "Detailed description",
      "category": "Category",
      "price": 49.99,
      "imageUrl": "https://via.placeholder.com/300x300",
      "affiliateUrl": "https://amazon.com/s?k=search+terms${AMAZON_ASSOCIATE_TAG && AMAZON_ASSOCIATE_TAG !== "none" ? `&tag=${AMAZON_ASSOCIATE_TAG}` : ''}"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("AI did not return outfit recommendations.");
    }

    const parsedResponse = JSON.parse(content);
    
    if (!parsedResponse.outfit || !Array.isArray(parsedResponse.outfit)) {
      throw new Error("AI response does not contain a valid outfit array.");
    }

    // Validate each item against the schema
    const validatedItems = parsedResponse.outfit.map((item: any) => {
      return AiOutfitItemSchema.parse(item);
    });

    return validatedItems;
  } catch (error) {
    console.error("Error generating AI outfit:", error);
    throw new Error("Failed to generate outfit recommendations. The AI service may be temporarily unavailable.");
  }
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const preferences = schema.parse(json);

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY environment variable is not set.");
      return new Response(superjson.stringify({ error: "AI service is not configured." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Generating AI outfit for user ${user.id} with preferences:`, preferences);

    // Generate the outfit using OpenAI
    const outfitItems = await generateAiOutfit({ ...preferences, gender: user.gender }, openaiApiKey);

    if (outfitItems.length === 0) {
      return new Response(superjson.stringify({ error: "Could not generate any outfit items. Please try again with different preferences." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response: OutputType = { outfit: outfitItems };

    console.log(`Generated ${outfitItems.length} outfit items for user ${user.id}`);

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in AI outfit generation endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    const status = errorMessage.includes("configured") ? 503 : 400;

    return new Response(superjson.stringify({ error: errorMessage }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}