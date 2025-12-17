import sgMail from "@sendgrid/mail";
import { generateHelloEmailContent } from "./email-templates";

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

if (!SENDGRID_API_KEY || !FROM_EMAIL || !APP_URL) {
  throw new Error(
    `Missing required environment variables: SENDGRID_API_KEY=${SENDGRID_API_KEY}, SENDGRID_FROM_EMAIL=${FROM_EMAIL}, NEXT_PUBLIC_APP_URL=${APP_URL}`
  );
}

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface SendInvitationEmailParams {
  email: string;
  organizationName: string;
  inviterName: string;
  invitationToken: string;
  role: string;
}

export async function sendHelloEmail({ email }: SendInvitationEmailParams) {
  // Generate email content based on language
  const emailContent = generateHelloEmailContent({ email });

  const msg = {
    to: email,
    from: FROM_EMAIL!,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error(error as Error, {
      message: "Failed to send hello email",
      email,
    });
    throw error;
  }
}
