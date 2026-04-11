// Import OpenAI and Supabase at the top
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

31;

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
  const lowerText = text.toLowerCase();

  for (const color of colors) {
    if (lowerText.includes(color)) {
      return color;
    }
  }
  return null;
}

// ==================== AI FUNCTIONS ====================

async function getEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("❌ Embedding failed:", error);
    throw error;
  }
}

async function analyzeImage(imageUrl) {
  try {
    console.log(" Analyzing image:", imageUrl);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this lost/found item in detail. MOST IMPORTANT: Start with the PRIMARY COLOR (this is critical for matching). Then include: brand/type, size, secondary colors, condition, and any distinctive features like stickers, scratches, wear patterns, or unique markings. Be very specific about colors.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 200,
    });

    const aiDescription = response.choices[0].message.content || "";
    console.log("✅ AI image analysis:", aiDescription);
    return aiDescription;
  } catch (error) {
    console.error("❌ Image analysis failed:", error);
    return "";
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
    console.log(" AI: Starting matching for found item...");

    // Create text representation
    let foundText = `${foundItem.title} ${foundItem.description} ${foundItem.location || ""}`;

    // If image exists, analyze it and add to text
    if (foundItem.image_url) {
      console.log("🖼️ Found item has image, analyzing...");
      const imageAnalysis = await analyzeImage(foundItem.image_url);
      if (imageAnalysis) {
        foundText = `${foundText} ${imageAnalysis}`;
        console.log("✅ Enhanced description with image analysis");
      }
    }

    console.log("🤖 Found item text:", foundText);

    // Get embedding for found item
    console.log("🤖 Getting embedding for found item...");
    const foundEmbedding = await getEmbedding(foundText);
    console.log("✅ Found item embedding generated");

    // Get all active lost items from database
    console.log("🤖 Fetching lost items from database...");
    const { data: lostItems, error } = await supabase
      .from("lost_found_items")
      .select("*")
      .eq("type", "lost")
      .eq("status", "active");

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    if (!lostItems || lostItems.length === 0) {
      console.log("🤖 No lost items in database to match against");
      return [];
    }

    console.log(`🤖 Comparing against ${lostItems.length} lost items...`);

    //  Analyze ALL images in parallel
    console.log("🖼️ Analyzing all images in parallel...");
    const lostItemsWithAnalysis = await Promise.all(
      lostItems.map(async (lostItem) => {
        let lostText = `${lostItem.title} ${lostItem.description} ${lostItem.location || ""}`;

        if (lostItem.image_url) {
          try {
            const imageAnalysis = await analyzeImage(lostItem.image_url);
            if (imageAnalysis) {
              lostText = `${lostText} ${imageAnalysis}`;
            }
          } catch (error) {
            console.error(
              `   ⚠️ Failed to analyze image for "${lostItem.title}"`
            );
          }
        }

        return { ...lostItem, enhancedText: lostText };
      })
    );

    console.log(" All images analyzed!");

    // Calculate similarities
    const matches = [];

    // Extract found item color
    const foundColor = extractColor(
      `${foundItem.title} ${foundItem.description}`
    );
    if (foundColor) {
      console.log(`🎨 Found item color detected: ${foundColor}`);
    }

    for (let i = 0; i < lostItemsWithAnalysis.length; i++) {
      const lostItem = lostItemsWithAnalysis[i];
      console.log(
        `🤖 Checking lost item ${i + 1}/${lostItemsWithAnalysis.length}: "${lostItem.title}"`
      );

      const lostEmbedding = await getEmbedding(lostItem.enhancedText);
      let similarity = cosineSimilarity(foundEmbedding, lostEmbedding); // ← let으로 변경!

      // 색상 페널티 추가
      const lostColor = extractColor(
        `${lostItem.title} ${lostItem.description}`
      );
      if (foundColor && lostColor && foundColor !== lostColor) {
        console.log(
          `    Color mismatch: ${foundColor} vs ${lostColor} - applying 50% penalty`
        );
        similarity = similarity * 0.5; // 50% 감소
      }

      console.log(`Similarity: ${(similarity * 100).toFixed(1)}%`);

      if (similarity > 0.7) {
        let confidence = "Good";
        if (similarity > 0.85) confidence = "Very High";
        else if (similarity > 0.8) confidence = "High";

        console.log(
          `    MATCH FOUND! (${(similarity * 100).toFixed(1)}%) - ${confidence} confidence`
        );

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
    return matches;
  } catch (error) {
    console.error("❌ AI matching error:", error);
    return [];
  }
}

async function notifyMatchedUsers(matches, foundItem) {
  console.log(`📧 Notifying ${matches.length} matched users...`);

  for (const match of matches) {
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
