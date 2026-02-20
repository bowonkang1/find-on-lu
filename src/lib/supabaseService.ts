import { supabase } from './supabase';
import { Resend } from 'resend';
import OpenAI from 'openai';

const resend = new Resend(process.env.REACT_APP_RESEND_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// ==================== THRIFT ITEMS ====================

export async function getThriftItems() {
  const { data, error } = await supabase
    .from('thrift_items')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching thrift items:', error);
    throw error;
  }
  return data;
}

export async function createThriftItem(item: {
  title: string;
  description: string;
  price: number;
  category?: string;
  condition?: string;
  image_url?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('thrift_items')
    .insert([
      {
        title: item.title,
        description: item.description,
        price: item.price,
        category: item.category,
        condition: item.condition,
        image_url: item.image_url,
        user_id: user.id,
        user_email: user.email,
        status: 'active'
      }
    ])
    .select();
  
  if (error) throw error;
  return data[0];
}

export async function deleteThriftItem(id: string) {
  const { error } = await supabase
    .from('thrift_items')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting thrift item:', error);
    throw error;
  }
}

// ==================== LOST & FOUND ITEMS ====================

export async function getLostFoundItems() {
  const { data, error } = await supabase
    .from('lost_found_items')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching lost/found items:', error);
    throw error;
  }
  return data;
}

export async function createLostFoundItem(item: {
  title: string;
  description: string;
  type: 'lost' | 'found';
  location: string;
  date: string;
  image_url?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('lost_found_items')
    .insert([
      {
        title: item.title,
        description: item.description,
        type: item.type,
        location: item.location,
        date: item.date,
        image_url: item.image_url,
        user_id: user.id,
        user_email: user.email,
        status: 'active'
      }
    ])
    .select();
  
  if (error) {
    console.error('Error creating lost/found item:', error);
    throw error;
  }
  return data[0];
}


export async function deleteLostFoundItem(id: string) {
  const { error } = await supabase
    .from('lost_found_items')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting lost/found item:', error);
    throw error;
  }
}

// ==================== IMAGE UPLOAD ====================

export async function uploadItemImage(file: File): Promise<string | null> {
  try {
    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }

    console.log('✅ Upload successful:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('item-images')
      .getPublicUrl(filePath);

    console.log('🔗 Public URL:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

// ==================== GET USER'S OWN POSTS ====================

export async function getMyThriftItems() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('thrift_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching my thrift items:', error);
    throw error;
  }
  return data;
}

export async function getMyLostFoundItems() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('lost_found_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching my lost/found items:', error);
    throw error;
  }
  return data;
}

// Update Thrift Item
export async function updateThriftItem(id: string, updates: Partial<{//partial-> all fields are optional
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  image_url?: string;
}>) {
  const { data, error } = await supabase //destructuring(extracts properties from object) 
    .from('thrift_items') //thrift_items table
    .update(updates) //the object we passed(what to update)
    .eq('id', id) // only update the row where id matches
    .select() //return the updated row
    .single(); //return as a single object

  if (error) throw error; // If update failed, throw error
  return data; //If success, return the updated item
}

// Update Lost & Found Item
export async function updateLostFoundItem(id: string, updates: Partial<{
  title: string;
  description: string;
  location: string;
  date: string;
  type: 'lost' | 'found';
  image_url?: string;
}>) {
  const { data, error } = await supabase
    .from('lost_found_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==================== EMAIL FUNCTIONS ====================

interface NewItemEmailParams {
  to: string[];
  itemType: 'lost' | 'found' | 'thrift';
  itemTitle: string;
  itemDescription: string;
  itemLocation?: string;
  itemPrice?: number;
  posterEmail: string;
  itemUrl: string;
}

export async function sendNewItemNotification(params: NewItemEmailParams) {
  const {
    to,
    itemType,
    itemTitle,
    itemDescription,
    itemLocation,
    itemPrice,
    posterEmail,
    itemUrl,
  } = params;

  const subject = 
    itemType === 'thrift' 
      ? `🛍️ New Item for Sale: ${itemTitle}` 
      : `🔍 New ${itemType === 'lost' ? 'Lost' : 'Found'} Item: ${itemTitle}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background-color: #003f87; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
          .badge { display: inline-block; padding: 5px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
          .lost-badge { background-color: #fee; color: #c00; }
          .found-badge { background-color: #efe; color: #060; }
          .thrift-badge { background-color: #eef; color: #006; }
          .button { display: inline-block; padding: 12px 24px; background-color: #003f87; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Find On LU</h1>
            <p>New Item Posted</p>
          </div>
          <div class="content">
            <span class="badge ${itemType === 'lost' ? 'lost-badge' : itemType === 'found' ? 'found-badge' : 'thrift-badge'}">
              ${itemType.toUpperCase()}
            </span>
            <h2>${itemTitle}</h2>
            ${itemPrice ? `<p style="font-size: 24px; color: #060; font-weight: bold;">$${itemPrice}</p>` : ''}
            <p><strong>Description:</strong></p>
            <p>${itemDescription}</p>
            ${itemLocation ? `<p><strong>Location:</strong> ${itemLocation}</p>` : ''}
            <p><strong>Posted by:</strong> ${posterEmail.split('@')[0]}</p>
            <a href="${itemUrl}" class="button">View Item</a>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              Want to contact the poster? Click "View Item" and use the contact button.
            </p>
          </div>
          <div class="footer">
            <p>You're receiving this because you're a member of Find On LU.</p>
            <p>Lawrence University Campus Marketplace</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
New ${itemType} item posted on Find On LU!

${itemTitle}
${itemPrice ? `Price: $${itemPrice}` : ''}

${itemDescription}

${itemLocation ? `Location: ${itemLocation}` : ''}
Posted by: ${posterEmail.split('@')[0]}

View item: ${itemUrl}
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Find On LU <onboarding@resend.dev>',
      to: to,
      subject: subject,
      html: htmlBody,
      text: textBody,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    console.log('✅ Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

export async function getAllUserEmails(): Promise<string[]> {
  try {
    const { data: lostFoundUsers } = await supabase
      .from('lost_found_items')
      .select('user_email');

    const { data: thriftUsers } = await supabase
      .from('thrift_items')
      .select('user_email');

    const allEmails: string[] = [];
    
    if (lostFoundUsers) {
      lostFoundUsers.forEach((u: any) => {
        if (u.user_email && typeof u.user_email === 'string') {
          allEmails.push(u.user_email);
        }
      });
    }
    
    if (thriftUsers) {
      thriftUsers.forEach((u: any) => {
        if (u.user_email && typeof u.user_email === 'string') {
          allEmails.push(u.user_email);
        }
      });
    }

    const uniqueEmails = Array.from(new Set(allEmails));
    
    console.log(`📧 Found ${uniqueEmails.length} unique users`);
    return uniqueEmails;
  } catch (error) {
    console.error('Error getting user emails:', error);
    return [];
  }
}

// ==================== AI MATCHING FUNCTIONS ====================

// Get embedding (AI vector) for text
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ Embedding failed:', error);
    throw error;
  }
}

// Calculate similarity between two vectors (0 = different, 1 = identical)
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Find matching lost items for a found item
export async function findMatchingLostItems(foundItem: {
  title: string;
  description: string;
  location?: string;
}): Promise<any[]> {
  try {
    console.log('🤖 AI: Starting matching for found item...');
    
    // Create text representation of found item
    const foundText = `${foundItem.title} ${foundItem.description} ${foundItem.location || ''}`;
    console.log('🤖 Found item text:', foundText);
    
    // Get embedding for found item
    console.log('🤖 Getting embedding for found item...');
    const foundEmbedding = await getEmbedding(foundText);
    console.log('✅ Found item embedding generated');
    
    // Get all active lost items from database
    console.log('🤖 Fetching lost items from database...');
    const { data: lostItems, error } = await supabase
      .from('lost_found_items')
      .select('*')
      .eq('type', 'lost')
      .eq('status', 'active');
    
    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
    
    if (!lostItems || lostItems.length === 0) {
      console.log('🤖 No lost items in database to match against');
      return [];
    }
    
    console.log(`🤖 Comparing against ${lostItems.length} lost items...`);
    
    // Find matches
    const matches = [];
    for (let i = 0; i < lostItems.length; i++) {
      const lostItem = lostItems[i];
      console.log(`🤖 Checking lost item ${i + 1}/${lostItems.length}: "${lostItem.title}"`);
      
      // Create text for lost item
      const lostText = `${lostItem.title} ${lostItem.description} ${lostItem.location || ''}`;
      
      // Get embedding for lost item
      const lostEmbedding = await getEmbedding(lostText);
      
      // Calculate similarity
      const similarity = cosineSimilarity(foundEmbedding, lostEmbedding);
      console.log(`   Similarity: ${(similarity * 100).toFixed(1)}%`);
      
      // If similarity > 75%, it's a potential match
      if (similarity > 0.75) {
        console.log(`   ✅ MATCH FOUND! (${(similarity * 100).toFixed(1)}%)`);
        matches.push({
          item: lostItem,
          score: similarity,
        });
      }
    }
    
    // Sort by best match first
    matches.sort((a, b) => b.score - a.score);
    
    console.log(`🎉 AI matching complete! Found ${matches.length} potential matches`);
    return matches;
    
  } catch (error) {
    console.error('❌ AI matching error:', error);
    return [];
  }
}

// Send email notifications to matched users
export async function notifyMatchedUsers(
  matches: any[],
  foundItem: {
    title: string;
    description: string;
    location?: string;
    user_email: string;
  }
) {
  console.log(`📧 Notifying ${matches.length} matched users...`);
  
  for (const match of matches) {
    try {
      const matchPercent = Math.round(match.score * 100);
      console.log(`📧 Sending email to ${match.item.user_email} (${matchPercent}% match)`);
      
      await sendNewItemNotification({
        to: [match.item.user_email],
        itemType: 'found',
        itemTitle: `🎉 Possible Match Found!`,
        itemDescription: `Someone found an item that might match your lost "${match.item.title}"!

Match confidence: ${matchPercent}%

Found item details:
- Title: ${foundItem.title}
- Description: ${foundItem.description}
- Location: ${foundItem.location || 'Not specified'}

Please check the details carefully to verify if this is your item.`,
        itemLocation: foundItem.location,
        posterEmail: foundItem.user_email,
        itemUrl: `${window.location.origin}/lost-found`,
      });
      
      console.log(`✅ Email sent to ${match.item.user_email}`);
    } catch (error) {
      console.error(`❌ Failed to notify ${match.item.user_email}:`, error);
    }
  }
  
  console.log('📧 All notification emails sent!');
}