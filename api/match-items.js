// Found-item matching: embeddings + similarity scoring + optional Resend emails.
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

// ==================== HELPER FUNCTIONS ====================

function extractColor(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return null;
  }

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
    // Match whole words only to avoid false positives like "tapered" -> "red".
    const wordPattern = new RegExp(`\\b${color}\\b`, "i");
    if (wordPattern.test(lowerText)) {
      return color;
    }
  }
  return null;
}

function extractPrimaryColorFromAnalysis(analysisText) {
  if (typeof analysisText !== "string" || analysisText.trim().length === 0) {
    return null;
  }

  const primaryLine = analysisText
    .split("\n")
    .find((line) => /primary color/i.test(line));

  if (!primaryLine) return null;
  return extractColor(primaryLine);
}

function normalizeColor(color) {
  if (!color) return null;

  const groups = {
    blue: ["blue", "navy", "teal"],
    red: ["red", "maroon"],
    gray: ["gray", "grey", "silver"],
    brown: ["brown", "beige"],
  };

  for (const [normalized, variants] of Object.entries(groups)) {
    if (variants.includes(color)) return normalized;
  }

  return color;
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
    console.error("ERROR Embedding failed:", error);
    throw error;
  }
}

async function analyzeImage(imageUrl) {
  try {
    console.log("INFO Analyzing image:", imageUrl);

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
    console.log("INFO AI image analysis:", aiDescription);
    return aiDescription;
  } catch (error) {
    console.error("ERROR Image analysis failed:", error);
    return "";
  }
}

function cosineSimilarity(a, b) {
  if (//checks if the embeddings are arrays and have the same length and are not empty
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    a.length === 0 ||
    b.length === 0 ||
    a.length !== b.length 
  ) {
    return 0;
  }

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

function normalizeEmbedding(rawEmbedding) { //normalizes the embedding by converting it to an array of numbers and filtering out any non-finite values
  if (Array.isArray(rawEmbedding)) {
    const nums = rawEmbedding.map(Number).filter(Number.isFinite);
    return nums.length > 0 ? nums : null;
  }

  if (typeof rawEmbedding === "string") { //if the embedding is a string, it is parsed as a JSON object
    try {
      const parsed = JSON.parse(rawEmbedding);
      if (Array.isArray(parsed)) {
        const nums = parsed.map(Number).filter(Number.isFinite);
        return nums.length > 0 ? nums : null;
      }
    } catch (_error) {
      // Continue to pgvector string parsing fallback.
    }

    const trimmed = rawEmbedding.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const nums = trimmed
        .slice(1, -1)
        .split(",")
        .map((value) => Number(value.trim()))
        .filter(Number.isFinite);
      return nums.length > 0 ? nums : null;
    }
  }

  return null;
}

async function findMatchingLostItems(foundItem) {
  try {
    console.log("INFO Starting matching for found item");

    const foundBaseText = `${foundItem.title} ${foundItem.description} ${foundItem.location || ""}`;
    let foundImageAnalysis = "";
    let foundImageEmbedding = null;

    console.log("INFO Generating base found-item embedding");
    const foundBaseEmbedding = normalizeEmbedding(await getEmbedding(foundBaseText));
    if (!foundBaseEmbedding) {
      throw new Error("Invalid found-item embedding format");
    }
    console.log("INFO Base found-item embedding generated");

    // Use image analysis as a weighted signal (not a full replacement)
    // so that image context improves accuracy without overpowering text similarity.
    if (foundItem.image_url) {
      console.log("INFO Analyzing found item image for supplemental signal");
      foundImageAnalysis = await analyzeImage(foundItem.image_url);
      if (foundImageAnalysis) {
        const foundImageText = `${foundBaseText} ${foundImageAnalysis}`;
        foundImageEmbedding = normalizeEmbedding(await getEmbedding(foundImageText));
        if (foundImageEmbedding) {
          console.log("INFO Image-augmented found-item embedding generated");
        } else {
          console.warn("WARN Skipping image signal due to invalid embedding format");
        }
      }
    }

    console.log("INFO Fetching lost items with embeddings from database");

    const MAX_COMPARISONS = 50;
    const MAX_MATCHES_TO_NOTIFY = 3;

    const { data: lostItems, error } = await foundItem.supabaseClient
      .from("lost_found_items")
      .select("*")
      .eq("type", "lost")
      .eq("status", "active")
      .not("embedding", "is", null)
      .order("created_at", { ascending: false })
      .limit(MAX_COMPARISONS);

    if (error) {
      console.error("ERROR Database error:", error);
      throw error;
    }

    if (!lostItems || lostItems.length === 0) {
      console.log("INFO No lost items with embeddings found");
      return [];
    }

    console.log(
      `INFO Comparing against ${lostItems.length} lost items (max: ${MAX_COMPARISONS})`
    );

    const matches = [];

    const foundTextColor = extractColor(
      `${foundItem.title} ${foundItem.description}`
    );
    const foundImageColor = extractPrimaryColorFromAnalysis(foundImageAnalysis);
    const foundColor = normalizeColor(foundTextColor || foundImageColor);
    if (foundColor) {
      console.log(`INFO Found item color detected: ${foundColor}`);
    }

    let comparisonCount = 0;
    let matchCount = 0;

    for (const lostItem of lostItems) {
      if (matchCount >= MAX_MATCHES_TO_NOTIFY) {
        console.log(`INFO Found ${matchCount} strong matches; stopping`);
        break;
      }

      comparisonCount++;
      console.log(
        `INFO Checking lost item ${comparisonCount}/${lostItems.length}: "${lostItem.title}"`
      );

      const lostEmbedding = normalizeEmbedding(lostItem.embedding); //normalizes the lost item embeddinng
      if (!lostEmbedding) {
        console.warn(
          `WARN Skipping lost item with invalid embedding format: ${lostItem.id}`
        );
        continue;
      }

      if (lostEmbedding.length !== foundBaseEmbedding.length) {
        console.warn(
          `WARN Skipping lost item with embedding dimension mismatch: ${lostItem.id}`
        );
        continue;
      }

      const baseSimilarity = cosineSimilarity(foundBaseEmbedding, lostEmbedding);
      let similarity = baseSimilarity;
      let imageSimilarity = null;

      if (
        foundImageEmbedding &&
        foundImageEmbedding.length === lostEmbedding.length
      ) {
        imageSimilarity = cosineSimilarity(foundImageEmbedding, lostEmbedding);
        // Weighted blend: text remains primary, image signal nudges confidence.
        similarity = baseSimilarity * 0.8 + imageSimilarity * 0.2;
      }

      const lostColor = normalizeColor(
        extractColor(`${lostItem.title} ${lostItem.description}`)
      );
      if (foundColor && lostColor && foundColor !== lostColor) {
        console.log(
          `WARN Color mismatch: ${foundColor} vs ${lostColor} — applying 20% penalty`
        );
        similarity = similarity * 0.8;
      }

      if (imageSimilarity !== null) {
        console.log(
          `INFO Similarity: ${(similarity * 100).toFixed(1)}% (text ${(baseSimilarity * 100).toFixed(1)}%, image ${(imageSimilarity * 100).toFixed(1)}%)`
        );
      } else {
        console.log(`INFO Similarity: ${(similarity * 100).toFixed(1)}%`);
      }

      if (similarity > 0.7) {
        let confidence = "Good";
        if (similarity > 0.85) confidence = "Very High";
        else if (similarity > 0.8) confidence = "High";

        console.log(
          `INFO Match accepted (${(similarity * 100).toFixed(1)}%), confidence: ${confidence}`
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
      `INFO Matching complete: ${matches.length} potential matches`
    );
    console.log(
      `INFO Compared ${comparisonCount} items; matched ${matchCount}`
    );

    return matches;
  } catch (error) {
    console.error("ERROR AI matching error:", error);
    return [];
  }
}

async function notifyMatchedUsers(matches, foundItem) {
  const MAX_MATCHES_TO_NOTIFY = 3;
  const topMatches = matches.slice(0, MAX_MATCHES_TO_NOTIFY);

  console.log(
    `INFO Notifying top ${topMatches.length} users (${matches.length} total matches)`
  );

  if (matches.length > MAX_MATCHES_TO_NOTIFY) {
    console.log(
      `INFO Skipping ${matches.length - MAX_MATCHES_TO_NOTIFY} lower-confidence matches`
    );
  }

  for (const match of topMatches) {
    try {
      const matchPercent = Math.round(match.score * 100);
      const confidence = match.confidence || "Good";
      const supportEmail = process.env.SUPPORT_EMAIL || "support@findonlu.com";
      const foundAt = foundItem.created_at
        ? new Date(foundItem.created_at).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "Not available";

      console.log(
        `INFO Sending email to ${match.item.user_email} (${matchPercent}% match, ${confidence} confidence)`
      );

      let subject = "";
      if (confidence === "Very High") {
        subject = `🎯 Very High Match (${matchPercent}%): Your lost item likely found!`;
      } else if (confidence === "High") {
        subject = `✅ High Match (${matchPercent}%): Possible match for your lost item`;
      } else {
        subject = `🔍 Good Match (${matchPercent}%): Check if this matches your item`;
      }

      let confidenceMessage = "";
      if (confidence === "Very High") {
        confidenceMessage = "This is a very strong match!";
      } else if (confidence === "High") {
        confidenceMessage = "This looks like a good match.";
      } else {
        confidenceMessage =
          "This might be your item - please verify the details carefully.";
      }

      const appUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/lost-found`
        : "http://localhost:3000/lost-found";
      const matchUrl = foundItem.id
        ? `${appUrl}?matchItemId=${encodeURIComponent(foundItem.id)}`
        : appUrl;

      const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #003f87; margin-bottom: 20px;">🎯 Item Match Found!</h2>
  
      <p style="line-height: 1.6; color: #333; margin: 0 0 12px 0;">
        Someone found an item that matches your lost "<strong>${match.item.title}</strong>"!
      </p>

      <p style="line-height: 1.6; color: #333; margin: 0 0 12px 0;">
        <strong>Match Confidence:</strong> ${confidence} (${matchPercent}%)
      </p>

      <p style="line-height: 1.6; color: #333; margin: 0 0 12px 0;">
        ${confidenceMessage}
      </p>

      <div style="line-height: 1.6; color: #333; margin: 0 0 12px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Found Item Details:</strong></p>
        <ul style="margin: 0; padding-left: 18px;">
          <li><strong>Title:</strong> ${foundItem.title}</li>
          <li><strong>Description:</strong> ${foundItem.description}</li>
          <li><strong>Location:</strong> ${foundItem.location || "Not specified"}</li>
        </ul>
      </div>

      <p style="line-height: 1.6; color: #333; margin: 0 0 12px 0;">
        Please check the details carefully to confirm if this is your item.
      </p>

  <p style="line-height: 1.6; color: #333; margin: 10px 0 0 0;">
    <strong>Found At:</strong> ${foundAt}
  </p>
  
  <div style="margin: 30px 0; text-align: center;">
    <a href="${matchUrl}" 
       style="background-color: #003f87; 
              color: white; 
              padding: 14px 32px; 
              text-decoration: none; 
              border-radius: 6px; 
              display: inline-block;
              font-weight: bold;
              font-size: 16px;">
      View Match
    </a>
  </div>

  <p style="color: #7c2d12; background-color: #ffedd5; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 12px; font-size: 13px;">
    AI suggestion only: this is a potential match and may be incorrect. Please verify details before making contact.
  </p>
  
  <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
    Or visit: <a href="${matchUrl}" style="color: #003f87;">${matchUrl}</a>
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    Do not reply to this message. For support, contact <a href="mailto:${supportEmail}" style="color: #003f87;">${supportEmail}</a>.<br><br>
    This is an automated message from Find On LU<br>
    Lawrence University Lost & Found Platform
  </p>
</div>
`;

      const { data, error } = await resend.emails.send({
        from: `Find On LU <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
        to: [match.item.user_email],
        subject: subject,
        html: htmlBody,
      });

      if (error) {
        console.error("ERROR Resend error:", error);
      } else {
        console.log("INFO Email sent successfully:", data);
      }
    } catch (error) {
      console.error(`ERROR Failed to notify ${match.item.user_email}:`, error);
    }
  }

  console.log("INFO All notification emails sent");
}

// ==================== SERVERLESS HANDLER ====================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing authentication token" });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: "Invalid or expired authentication token" });
    }

    const authedSupabase = createClient( //creates a new Supabase client with the authentication token
      process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { foundItem } = req.body;
    if (!foundItem) {
      return res.status(400).json({ error: "Missing foundItem data" });
    }

    const safeFoundItem = {
      id: foundItem.id,
      created_at: foundItem.created_at,
      title: foundItem.title,
      description: foundItem.description,
      location: foundItem.location,
      image_url: foundItem.image_url,
      // Always trust authenticated user identity over client payload.
      user_email: authData.user.email || "",
      supabaseClient: authedSupabase,
    };

    console.log("INFO Background matching started for:", foundItem.title);

    const matches = await findMatchingLostItems(safeFoundItem);

    if (matches.length > 0) {
      await notifyMatchedUsers(matches, safeFoundItem);
    }

    return res.status(200).json({
      success: true,
      matches: matches.length,
      message: `Found ${matches.length} potential matches`,
    });
  } catch (error) {
    console.error("ERROR Background job error:", error);
    return res.status(500).json({
      error: "Matching failed",
      details: error.message,
    });
  }
}
