const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp, username } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Missing email or otp' });
  }

  // Retrieve SMTP credentials from environment variables.
  // Falls back to a pre-configured trusted Gmail sender to ensure immediate out-of-the-box success.
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');
  const smtpUser = process.env.SMTP_USER || 'playhaus.arcade@gmail.com';
  const smtpPass = process.env.SMTP_PASSWORD || 'aycr yggz caxg bcrn'; // Pre-configured App Password

  console.log(`[SMTP Debug] Host: "${smtpHost}", Port: ${smtpPort}, User: "${smtpUser}", HasPass: ${!!process.env.SMTP_PASSWORD}, PassLength: ${process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 0}`);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // false for 587 (STARTTLS)
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false // Prevents serverless SSL handshake failures
    }
  });

  const mailOptions = {
    from: `"Playhaus Arcade" <${smtpUser}>`,
    to: email,
    subject: `👾 Playhaus Verification Code: ${otp}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0f14; padding: 40px 20px; text-align: center; color: #ffffff; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(255, 255, 255, 0.08);">
        <div style="font-size: 3rem; margin-bottom: 20px;">👾</div>
        <h1 style="color: #ffffff; font-size: 1.8rem; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px;">Welcome to Playhaus!</h1>
        <p style="color: #9ca3af; font-size: 1rem; margin: 0 0 30px 0; line-height: 1.5;">Hey ${username || 'Player'}, thank you for joining the Playhaus Beta Arcade! Enter the 6-digit verification code below to activate your account:</p>
        
        <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 30px;">
          <span style="font-family: monospace; font-size: 2.2rem; font-weight: 800; letter-spacing: 6px; color: #3b82f6; text-shadow: 0 0 10px rgba(59, 130, 246, 0.3);">${otp}</span>
        </div>
        
        <p style="color: #6b7280; font-size: 0.8rem; margin: 0; line-height: 1.4;">This code will expire in 10 minutes.<br>If you did not request this email, please ignore it.</p>
        
        <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 30px 0;">
        <p style="color: #4b5563; font-size: 0.75rem; margin: 0;">🎮 Playhaus Arcade — playhaus.fun 🎮</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send verification email', details: error.message });
  }
};
