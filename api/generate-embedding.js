//Generates and saves embeddings for Lost items
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

function createAuthedSupabase(token) {
  return createClient(
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
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestLog = new Map();

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const entries = requestLog.get(ip) || [];
  const recentEntries = entries.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recentEntries.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(ip, recentEntries);
    return true;
  }

  recentEntries.push(now);
  requestLog.set(ip, recentEntries);
  return false;
}

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: "Too many requests. Try again shortly." });
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Missing authentication token" });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: "Invalid or expired authentication token" });
    }

    const { text, itemId } = req.body;

    if (!text || !itemId) {
      return res.status(400).json({ error: 'Missing text or itemId' });
    }
    if (typeof text !== "string" || text.trim().length === 0 || text.length > 3000) {
      return res.status(400).json({ error: "Invalid text payload" });
    }
    if (typeof itemId !== "string" || itemId.length > 100) {
      return res.status(400).json({ error: "Invalid itemId" });
    }

    console.log(`🤖 Generating embedding for item ${itemId}...`);

    // 임베딩 생성
    const embedding = await getEmbedding(text);

    console.log('✅ Embedding generated, saving to database...');

    // DB에 저장
    const authedSupabase = createAuthedSupabase(token);
    const { error: updateError } = await authedSupabase
      .from('lost_found_items')
      .update({ embedding: embedding })
      .eq('id', itemId);

    if (updateError) {
      console.error('❌ Database update failed:', updateError);
      throw updateError;
    }

    console.log('✅ Embedding saved successfully');

    return res.status(200).json({ 
      success: true,
      message: 'Embedding generated and saved'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate embedding',
      details: error.message 
    });
  }
}