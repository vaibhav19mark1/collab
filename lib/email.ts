import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Please define the RESEND_API_KEY in environment variables");
}

const resend = new Resend(process.env.RESEND_API_KEY!);

const EMAIL_CONFIG = {
  from: "Collab Platform <onboarding@resend.dev>", //! Update this with the verified domain later
  replyTo: process.env.SUPPORT_EMAIL || "support@example.com",
};

export { resend, EMAIL_CONFIG };
