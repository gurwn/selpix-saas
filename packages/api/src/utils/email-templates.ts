interface BaseEmailContent {
  subject: string;
  text: string;
  html: string;
}

interface InvitationEmailContent {
  email: string;
}

// Invitation Email Templates
export function generateHelloEmailContent({
  email,
}: InvitationEmailContent): BaseEmailContent {
  return {
    subject: `[Sample] Hello ${email}`,
    text: `안녕하세요,

Hello,

This is a test email.

Thank you,
Sam`,
    html: generateHelloEmailHtml({
      title: "Hello",
      greeting: "Hello,",
      invitationText: `This is a test email.`,
      platformDescription: "This is a test email.",
      buttonText: "Test",
      expireNotice: "⏰ This is a test email.",
      fallbackText:
        "If the button doesn't work, copy and paste this link into your browser:",
      invitationUrl: "https://www.google.com",
      footerText: "This email was sent for test purposes.",
    }),
  };
}

function generateHelloEmailHtml({
  title,
  greeting,
  invitationText,
  platformDescription,
  buttonText,
  expireNotice,
  fallbackText,
  invitationUrl,
  footerText,
}: {
  title: string;
  greeting: string;
  invitationText: string;
  platformDescription: string;
  buttonText: string;
  expireNotice: string;
  fallbackText: string;
  invitationUrl: string;
  footerText: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">MyApp</div>
    </div>
    <div class="content">
      <h2>${title}</h2>
      <p>${greeting}</p>
      <p>${invitationText}</p>
      <p>${platformDescription}</p>
      <div style="text-align: center;">
        <a href="${invitationUrl}" class="button">${buttonText}</a>
      </div>
      <p class="expire-notice">${expireNotice}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
      <p style="font-size: 14px; color: #666;">
        ${fallbackText}<br>
        <a href="${invitationUrl}" style="color: #2196f3; word-break: break-all;">${invitationUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>© 2025 MyApp. All rights reserved.</p>
      <p>${footerText}</p>
    </div>
  </div>
</body>
</html>
  
  `;
}
