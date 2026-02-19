import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

  // Create subject
  const subject = 
    itemType === 'thrift' 
      ? `🛍️ New Item for Sale: ${itemTitle}` 
      : `🔍 New ${itemType === 'lost' ? 'Lost' : 'Found'} Item: ${itemTitle}`;

  // Create HTML email
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background-color: #003f87;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .lost-badge { background-color: #fee; color: #c00; }
          .found-badge { background-color: #efe; color: #060; }
          .thrift-badge { background-color: #eef; color: #006; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #003f87;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Find On LU</h1>
            <p>New Item Posted</p>
          </div>
          <div class="content">
            <span class="badge ${
              itemType === 'lost' ? 'lost-badge' :
              itemType === 'found' ? 'found-badge' :
              'thrift-badge'
            }">
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

  // Create plain text version
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

export async function getAllUserEmails(supabase: any): Promise<string[]> {
    try {
      // Get emails from lost_found_items
      const { data: lostFoundUsers } = await supabase
        .from('lost_found_items')
        .select('user_email');
  
      // Get emails from thrift_items
      const { data: thriftUsers } = await supabase
        .from('thrift_items')
        .select('user_email');
  
      // Combine all emails
      const allEmails: string[] = [];
      
      // Add lost & found emails
      if (lostFoundUsers) {
        lostFoundUsers.forEach((u: any) => {
          if (u.user_email && typeof u.user_email === 'string') {
            allEmails.push(u.user_email);
          }
        });
      }
      
      // Add thrift emails
      if (thriftUsers) {
        thriftUsers.forEach((u: any) => {
          if (u.user_email && typeof u.user_email === 'string') {
            allEmails.push(u.user_email);
          }
        });
      }
  
      // Remove duplicates
      const uniqueEmails = Array.from(new Set(allEmails));
      
      console.log(`📧 Found ${uniqueEmails.length} unique users`);
      return uniqueEmails;
    } catch (error) {
      console.error('Error getting user emails:', error);
      return [];
    }
  }