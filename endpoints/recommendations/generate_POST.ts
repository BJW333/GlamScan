import { schema, OutputType, OutputSchema } from "./generate_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";
import superjson from "superjson";
import { OpenAI } from "openai";
import { AMAZON_ASSOCIATE_TAG } from "../../helpers/_publicConfigs";
import { Selectable } from "kysely";
import type { StyleCombos, StyleComboItems } from "../../helpers/schema";

interface AIAnalysis {
  faceShape: string;
  skinTone: string;
  style: string;
  bodyType: string;
  recommendations: string;
}

interface StyleComboWithItems extends Selectable<StyleCombos> {
  items: Selectable<StyleComboItems>[];
}

async function getAiAnalysis(base64Image: string, apiKey: string): Promise<AIAnalysis> {
  console.log("Calling OpenAI Vision API for style analysis");

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  // Remove data URL prefix if present
  const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  const prompt = `Analyze this selfie image and provide a detailed style analysis. Focus on:

1. Face shape analysis (oval, round, square, heart, diamond)
2. Skin tone assessment (warm, cool, neutral undertones) 
3. Style preference detection from visible clothing/accessories
4. Body type assessment from what's visible
5. Overall style recommendations based on the analysis

Please respond in this exact JSON format:
{
  "faceShape": "detected face shape",
  "skinTone": "detected skin tone and undertones",
  "style": "detected current style preference",
  "bodyType": "detected body type",
  "recommendations": "detailed recommendations for styles, colors, and types of clothing that would suit this person"
}

Be specific and detailed in your analysis to help with matching to appropriate style combinations.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response received from OpenAI");
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("OpenAI API Error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('content_policy_violation')) {
        throw new Error("Image content violates our safety guidelines. Please upload a different photo.");
      }
      if (error.message.includes('invalid_image')) {
        throw new Error("Invalid image format. Please upload a clear selfie photo.");
      }
      if (error.message.includes('rate_limit')) {
        throw new Error("Too many requests. Please try again in a few minutes.");
      }
    }
    
    throw new Error("AI service temporarily unavailable. Please try again later.");
  }
}

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey });
  
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getStyleCombosWithItems(): Promise<StyleComboWithItems[]> {
  const results = await db
    .selectFrom("styleCombos")
    .leftJoin("styleComboItems", "styleCombos.id", "styleComboItems.comboId")
    .select([
      "styleCombos.id",
      "styleCombos.title",
      "styleCombos.description",
      "styleCombos.coverImageUrl",
      "styleCombos.shopUrl",
      "styleCombos.totalPrice",
      "styleCombos.season",
      "styleCombos.occasion",
      "styleCombos.style",
      "styleCombos.isSponsored",
      "styleCombos.createdAt",
      "styleCombos.updatedAt",
      "styleComboItems.id as itemId",
      "styleComboItems.name as itemName",
      "styleComboItems.price as itemPrice",
      "styleComboItems.imageUrl as itemImageUrl",
      "styleComboItems.affiliateUrl as itemAffiliateUrl",
      "styleComboItems.itemOrder",
      "styleComboItems.createdAt as itemCreatedAt",
    ])
    .orderBy("styleCombos.id")
    .orderBy("styleComboItems.itemOrder", "asc")
    .execute();

  // Group results by style combo
  const styleComboMap = new Map<number, StyleComboWithItems>();
  
  for (const row of results) {
    const comboId = row.id;
    
    if (!styleComboMap.has(comboId)) {
      styleComboMap.set(comboId, {
        id: row.id,
        title: row.title,
        description: row.description,
        coverImageUrl: row.coverImageUrl,
        shopUrl: row.shopUrl,
        totalPrice: row.totalPrice,
        season: row.season,
        occasion: row.occasion,
        style: row.style,
        isSponsored: row.isSponsored,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        items: [],
      });
    }
    
    // Add item if it exists
    if (row.itemId) {
      styleComboMap.get(comboId)!.items.push({
        id: row.itemId,
        comboId: row.id,
        name: row.itemName!,
        price: row.itemPrice!,
        imageUrl: row.itemImageUrl!,
        affiliateUrl: row.itemAffiliateUrl!,
        itemOrder: row.itemOrder,
        createdAt: row.itemCreatedAt,
      });
    }
  }

  return Array.from(styleComboMap.values());
}

async function findSimilarStyleCombos(
  analysis: AIAnalysis,
  apiKey: string,
  limit: number = 5
): Promise<StyleComboWithItems[]> {
  console.log("Finding similar style combos using embeddings");
  
  // Get all style combos from database
  const styleCombos = await getStyleCombosWithItems();
  
  if (styleCombos.length === 0) {
    throw new Error("No style combinations found in database. Please add some style combos first.");
  }

  // Create a comprehensive text description for embedding
  const userProfile = `Face shape: ${analysis.faceShape}. Skin tone: ${analysis.skinTone}. Current style: ${analysis.style}. Body type: ${analysis.bodyType}. Recommendations: ${analysis.recommendations}`;
  
  // Generate embedding for user profile
  const userEmbedding = await generateEmbedding(userProfile, apiKey);
  
  // Calculate similarities with each style combo
  const similarities: Array<{ combo: StyleComboWithItems; similarity: number }> = [];
  
  for (const combo of styleCombos) {
    // Create description for each style combo
    const comboDescription = `Title: ${combo.title}. Description: ${combo.description || ''}. Style: ${combo.style || ''}. Season: ${combo.season || ''}. Occasion: ${combo.occasion || ''}`;
    
    try {
      const comboEmbedding = await generateEmbedding(comboDescription, apiKey);
      const similarity = cosineSimilarity(userEmbedding, comboEmbedding);
      
      similarities.push({ combo, similarity });
    } catch (error) {
      console.warn(`Failed to generate embedding for combo ${combo.id}:`, error);
    }
  }
  
  // Sort by similarity (highest first) and return top results
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(item => item.combo);
}

function generateAffiliateUrl(affiliateUrl: string) {
  // If the affiliate URL already contains a tag, return as is
  if (affiliateUrl.includes('tag=') || affiliateUrl.includes('associate')) {
    return affiliateUrl;
  }
  
  // Check if affiliate system is properly configured
  if (!AMAZON_ASSOCIATE_TAG || AMAZON_ASSOCIATE_TAG === "none") {
    console.warn("Amazon affiliate tag not configured. Links will not be monetized.");
    return affiliateUrl;
  }
  
  // If it's an Amazon URL, add our affiliate tag
  if (affiliateUrl.includes('amazon.com')) {
    const separator = affiliateUrl.includes('?') ? '&' : '?';
    return `${affiliateUrl}${separator}tag=${AMAZON_ASSOCIATE_TAG}`;
  }
  
  return affiliateUrl;
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { selfieBase64 } = schema.parse(json);

    // Validate required environment variables
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Image validation is now handled by the schema

    console.log(`Generating AI recommendations for user ${user.id}`);
    
    // Get AI analysis of the selfie
    const analysis = await getAiAnalysis(selfieBase64, openaiApiKey);
    console.log("AI Analysis completed:", analysis);
    
    // Find similar style combos using embedding similarity
    const similarCombos = await findSimilarStyleCombos(analysis, openaiApiKey, 5);
    
    if (similarCombos.length === 0) {
      throw new Error("No matching style combinations found. Please try again later.");
    }

    // Convert style combos to recommendations format
    const recommendations: OutputType['recommendations'] = [];
    
    for (const combo of similarCombos) {
      // Add the combo as an outfit recommendation
      recommendations.push({
        type: 'outfit' as const,
        name: combo.title,
        description: `${combo.description || 'Complete style combo'} - Curated based on your ${analysis.faceShape} face shape and ${analysis.skinTone} skin tone.`,
        price: Number(combo.totalPrice),
        imageUrl: combo.coverImageUrl,
        affiliateUrl: generateAffiliateUrl(combo.shopUrl),
      });

      // Add individual items from the combo
      for (const item of combo.items.slice(0, 2)) { // Limit items to avoid too many recommendations
        recommendations.push({
          type: item.name.toLowerCase().includes('makeup') || item.name.toLowerCase().includes('lipstick') || 
                item.name.toLowerCase().includes('foundation') || item.name.toLowerCase().includes('mascara') ? 'makeup' : 'outfit',
          name: item.name,
          description: `From "${combo.title}" collection - Perfect for your style preferences.`,
          price: Number(item.price),
          imageUrl: item.imageUrl,
          affiliateUrl: generateAffiliateUrl(item.affiliateUrl),
        });
      }
    }

    // Limit total recommendations to avoid overwhelming the user
    const finalRecommendations = recommendations.slice(0, 8);

    console.log(`Generated ${finalRecommendations.length} real recommendations for user ${user.id}`);

    const response: OutputType = { recommendations: finalRecommendations };
    
    // Validate the response against the schema
    const validatedResponse = OutputSchema.parse(response);

    return new Response(superjson.stringify(validatedResponse), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    // Return appropriate HTTP status codes
    const status = error instanceof Error && 
      (error.message.includes("not configured") || 
       error.message.includes("required") ||
       error.message.includes("Invalid image") ||
       error.message.includes("No style combinations found") ||
       error.message.includes("No matching style combinations")) ? 400 : 500;

    return new Response(superjson.stringify({ error: errorMessage }), {
      status: status,
      headers: { "Content-Type": "application/json" },
    });
  }
}