import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient( //creates a new Supabase client
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8; 
const MAX_RECIPIENTS = 10;
const requestLog = new Map(); 

//tries to find the requester's IP address from the request headers
function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {  
    return forwardedFor.split(',')[0].trim(); //returns the first IP address in the list
  }
  return req.socket?.remoteAddress || 'unknown'; //returns the remote address of the request
}

//checks if the requester has exceeded the rate limit
function isRateLimited(ip) {
  const now = Date.now();
  const entries = requestLog.get(ip) || [];
  const recentEntries = entries.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  //if the requester has exceeded the rate limit, return true
  if (recentEntries.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(ip, recentEntries);
    return true;
  }

  recentEntries.push(now); 
  requestLog.set(ip, recentEntries); 
  return false;
}
//checks if the email is a valied Lawrence email
function isValidLawrenceEmail(email) {
  return typeof email === 'string' && email.endsWith('@lawrence.edu');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const { to, subject, html } = req.body;
    //checks if the recipient list is valid
    if (!Array.isArray(to) || to.length === 0 || to.length > MAX_RECIPIENTS) { //checks if the recipient list is valid
      return res.status(400).json({ error: 'Invalid recipient list' }); 
    }
    if (!to.every(isValidLawrenceEmail)) {
      return res.status(400).json({ error: 'Recipients must be valid @lawrence.edu emails' });
    }
    if (typeof subject !== 'string' || subject.trim().length === 0 || subject.length > 200) {
      return res.status(400).json({ error: 'Invalid subject' });
    }
    if (typeof html !== 'string' || html.trim().length === 0 || html.length > 100000) {
      return res.status(400).json({ error: 'Invalid HTML body' });
    }

    const { data, error } = await resend.emails.send({
      from: `Find On LU <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return res.status(400).json({ error });
    }

    console.log('✅ Email sent:', { id: data?.id, recipientCount: to.length });
    return res.status(200).json({ success: true, data });
    
  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({ error: error.message });
  }
}