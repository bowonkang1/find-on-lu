import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html } = req.body;
    
    console.log('📧 Sending email to:', to);
    
    const { data, error } = await resend.emails.send({
      from: 'Find On LU <onboarding@resend.dev>',
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return res.status(400).json({ error });
    }

    console.log('✅ Email sent:', data);
    return res.status(200).json({ success: true, data });
    
  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({ error: error.message });
  }
}