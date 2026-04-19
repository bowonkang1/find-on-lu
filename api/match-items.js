//AI matching system
// Import OpenAI and Supabase at the top
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js"; //database client
import { Resend } from "resend"; //email service

//Initialize openAI client
const openai = new OpenAI({
  //Get API key from environment variables
  //Try OPENAI_API_KEY first, fallback to REACT_APP_OPENAI_API_KEY
  apiKey: process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY,
});

//Initialize Supabase client (database)
const supabase = createClient(
  //  Database URL (where data lives)
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  // API key to access the database
  process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Initialize Resend client (email service)
const resend = new Resend(process.env.RESEND_API_KEY);

// ==================== HELPER FUNCTIONS ====================

function extractColor(text) {
  const colors = [
    "red",
    "blue",
    "green",
    "yellow",
    "black",
    "white",
    "silver",
    "gold",
    "pink",
    "purple",
    "orange",
    "brown",
    "gray",
    "grey",
    "navy",
    "maroon",
    "teal",
    "beige",
  ];

  //convert text to lowercase for case-insensitive search
  const lowerText = text.toLowerCase();

  //loop through each color and check if it's in the text
  for (const color of colors) {
    if (lowerText.includes(color)) {
      return color; //// return first color found
    }
  }
  return null;
}

// ==================== AI FUNCTIONS ====================

//function to convert text into numbers(embeddings)
async function getEmbedding(text) {
  try {

     // call OpenAI API to create embedding
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small", // which AI model to use
      input: text,  // text to convert
      encoding_format: "float",  // return format (decimal numbers)
    });
    return response.data[0].embedding;
    //if something goes wrong
  } catch (error) {
    console.error("❌ Embedding failed:", error);
    throw error; //re-throw error to stop execution
  }
}

//function to describe an image using AI
async function analyzeImage(imageUrl) {
  try {
    //log which image we're analyzing
    console.log(" Analyzing image:", imageUrl);

    //call OpenAI's vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // vision model that can "see" images
      messages: [
        {
          role: "user", // we're asking a question
          content: [
            {
              type: "text", //first part-instructions
              text: "Describe this lost/found item in detail. MOST IMPORTANT: Start with the PRIMARY COLOR (this is critical for matching). Then include: brand/type, size, secondary colors, condition, and any distinctive features like stickers, scratches, wear patterns, or unique markings. Be very specific about colors.",
            },
            {
              type: "image_url", //second part- the image
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 200, //limit response to 200 words
    });

    // extract AI's description from response
    const aiDescription = response.choices[0].message.content || "";
    console.log("✅ AI image analysis:", aiDescription);
    return aiDescription;
  } catch (error) {
    //if image analysis fails
    console.error("❌ Image analysis failed:", error);
    return ""; //return empty string (continue without image description)
  }
}

function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

async function findMatchingLostItems(foundItem) {
  try {
    console.log("🤖 AI: Starting matching for found item...");

    // Generate embedding for found item only
    let foundText = `${foundItem.title} ${foundItem.description} ${foundItem.location || ""}`;

    // Analyze image (found item only)
    if (foundItem.image_url) {
      console.log("🖼️ Analyzing found item image...");
      const imageAnalysis = await analyzeImage(foundItem.image_url);
      if (imageAnalysis) {
        foundText = `${foundText} ${imageAnalysis}`;
      }
    }

    console.log("🤖 Generating found item embedding...");
    const foundEmbedding = await getEmbedding(foundText);
    console.log("✅ Found item embedding generated");

    // Fetch lost items with embeddings from database
    console.log("🤖 Fetching lost items with embeddings from database...");

    const MAX_COMPARISONS = 50;
    const MAX_MATCHES_TO_NOTIFY = 3;

    const { data: lostItems, error } = await supabase
      .from("lost_found_items")
      .select("*")
      .eq("type", "lost")
      .eq("status", "active")
      .not("embedding", "is", null) // Only items with embeddings
      .order("created_at", { ascending: false }) // Most recent first
      .limit(MAX_COMPARISONS);

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    if (!lostItems || lostItems.length === 0) {
      console.log("🤖 No lost items with embeddings found");
      return [];
    }

    console.log(
      `🤖 Comparing against ${lostItems.length} lost items (max: ${MAX_COMPARISONS})...`
    );

    // Calculate similarity only (no embedding generation!)
    const matches = [];

    // Extract found item color
    const foundColor = extractColor(
      `${foundItem.title} ${foundItem.description}`
    );
    if (foundColor) {
      console.log(`🎨 Found item color detected: ${foundColor}`);
    }

    let comparisonCount = 0;
    let matchCount = 0;

    for (const lostItem of lostItems) {
      // Stop after finding max matches
      if (matchCount >= MAX_MATCHES_TO_NOTIFY) {
        console.log(`✋ Found ${matchCount} strong matches, stopping`);
        break;
      }

      comparisonCount++;
      console.log(
        `🤖 Checking lost item ${comparisonCount}/${lostItems.length}: "${lostItem.title}"`
      );

      // Use embedding from database!
      const lostEmbedding = lostItem.embedding;

      // Calculate similarity (local, fast!)
      let similarity = cosineSimilarity(foundEmbedding, lostEmbedding);

      // Color penalty
      const lostColor = extractColor(
        `${lostItem.title} ${lostItem.description}`
      );
      if (foundColor && lostColor && foundColor !== lostColor) {
        console.log(
          `   ⚠️ Color mismatch: ${foundColor} vs ${lostColor} - applying 50% penalty`
        );
        similarity = similarity * 0.5;
      }

      console.log(`   Similarity: ${(similarity * 100).toFixed(1)}%`);

      // Match only if 70%+ similar
      if (similarity > 0.7) {
        let confidence = "Good";
        if (similarity > 0.85) confidence = "Very High";
        else if (similarity > 0.8) confidence = "High";

        console.log(
          `   ✅ MATCH! (${(similarity * 100).toFixed(1)}%) - ${confidence} confidence`
        );

        matchCount++;
        matches.push({
          item: lostItem,
          score: similarity,
          confidence: confidence,
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    console.log(
      `🎉 AI matching complete! Found ${matches.length} potential matches`
    );
    console.log(
      `📊 Compared: ${comparisonCount} items, Matched: ${matchCount} items`
    );

    return matches;
  } catch (error) {
    console.error("❌ AI matching error:", error);
    return [];
  }
}

async function notifyMatchedUsers(matches, foundItem) {
  // Notify top 3 matches only
  const MAX_MATCHES_TO_NOTIFY = 3;
  const topMatches = matches.slice(0, MAX_MATCHES_TO_NOTIFY);

  console.log(
    `📧 Notifying top ${topMatches.length} users (${matches.length} total matches)`
  );

  if (matches.length > MAX_MATCHES_TO_NOTIFY) {
    console.log(
      `ℹ️ Skipping ${matches.length - MAX_MATCHES_TO_NOTIFY} lower-confidence matches`
    );
  }

  for (const match of topMatches) {
    // Changed: matches → topMatches
    try {
      const matchPercent = Math.round(match.score * 100);
      const confidence = match.confidence || "Good";

      console.log(
        `📧 Sending email to ${match.item.user_email} (${matchPercent}% match - ${confidence} confidence)`
      );

      let subject = "";
      if (confidence === "Very High") {
        subject = `🎯 Very High Match (${matchPercent}%): Your lost item likely found!`;
      } else if (confidence === "High") {
        subject = `✅ High Match (${matchPercent}%): Possible match for your lost item`;
      } else {
        subject = `🔍 Good Match (${matchPercent}%): Check if this matches your item`;
      }

      let description = `Someone found an item that matches your lost "${match.item.title}"!\n\n`;
      description += `Match Confidence: ${confidence} (${matchPercent}%)\n\n`;

      if (confidence === "Very High") {
        description += `This is a very strong match! `;
      } else if (confidence === "High") {
        description += `This looks like a good match. `;
      } else {
        description += `This might be your item - please verify the details carefully. `;
      }

      description += `\n\nFound Item Details:\n`;
      description += `- Title: ${foundItem.title}\n`;
      description += `- Description: ${foundItem.description}\n`;
      description += `- Location: ${foundItem.location || "Not specified"}\n\n`;
      description += `Please check the details carefully to confirm if this is your item.`;

      // Send email directly via Resend
      console.log("📧 Sending email to:", match.item.user_email);

      //  App URL
      const appUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/lost-found`
        : "http://localhost:3000/lost-found";

      // HTML 이메일 본문
      const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #003f87; margin-bottom: 20px;">🎯 Item Match Found!</h2>
  
      <p style="line-height: 1.6; color: #333;">
    ${description.replace(/\n/g, "<br>")}
     </p>
  
  <div style="margin: 30px 0; text-align: center;">
    <a href="${appUrl}" 
       style="background-color: #003f87; 
              color: white; 
              padding: 14px 32px; 
              text-decoration: none; 
              border-radius: 6px; 
              display: inline-block;
              font-weight: bold;
              font-size: 16px;">
      View on Find On LU
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
    Or visit: <a href="${appUrl}" style="color: #003f87;">${appUrl}</a>
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    This is an automated message from Find On LU<br>
    Lawrence University Lost & Found Platform
  </p>
</div>
`;

      const { data, error } = await resend.emails.send({
        from: "Find On LU <onboarding@resend.dev>",
        to: [match.item.user_email],
        subject: subject,
        html: htmlBody, //
      });

      if (error) {
        console.error("❌ Resend error:", error);
      } else {
        console.log("✅ Email sent successfully:", data);
      }
    } catch (error) {
      console.error(`❌ Failed to notify ${match.item.user_email}:`, error);
    }
  }

  console.log("📧 All notification emails sent!");
}

// ==================== SERVERLESS HANDLER ====================

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { foundItem } = req.body;

  if (!foundItem) {
    return res.status(400).json({ error: "Missing foundItem data" });
  }

  try {
    console.log("🚀 Background job started for:", foundItem.title);

    // Run AI matching
    const matches = await findMatchingLostItems(foundItem);

    // Send emails if matches found
    if (matches.length > 0) {
      await notifyMatchedUsers(matches, foundItem);
    }

    return res.status(200).json({
      success: true,
      matches: matches.length,
      message: `Found ${matches.length} potential matches`,
    });
  } catch (error) {
    console.error("❌ Background job error:", error);
    return res.status(500).json({
      error: "Matching failed",
      details: error.message,
    });
  }
}
