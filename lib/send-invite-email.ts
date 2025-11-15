import { resend, EMAIL_CONFIG } from "./email";
import { getInviteEmailHtml, getInviteEmailText } from "./email-templates";

interface sendInviteEmailParamTypes {
  to: string;
  inviterName: string;
  roomName: string;
  roomDescription?: string;
  inviteUrl: string;
  expiresInDays: number;
}

const sendInviteEmail = async ({
  to,
  inviterName,
  roomName,
  roomDescription,
  inviteUrl,
  expiresInDays,
}: sendInviteEmailParamTypes) => {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [to],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `${inviterName} has invited you to join ${roomName} on Collab Platform`,
      html: getInviteEmailHtml({
        inviterName,
        roomName,
        roomDescription,
        inviteUrl,
        expiresInDays,
      }),
      text: getInviteEmailText({
        inviterName,
        roomName,
        roomDescription,
        inviteUrl,
        expiresInDays,
      }),
    });

    if (error) {
      console.error("Error sending invite email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Invite email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error in sendInviteEmail:", error);
    throw error;
  }
};

export { sendInviteEmail };
