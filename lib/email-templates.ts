interface InviteEmailProps {
  inviterName: string;
  roomName: string;
  roomDescription?: string;
  inviteUrl: string;
  expiresInDays: number;
}

export const getInviteEmailHtml = ({
  inviterName,
  roomName,
  roomDescription,
  inviteUrl,
  expiresInDays,
}: InviteEmailProps): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Room Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🎉 You're Invited!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi there! 👋
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join their collaboration room on <strong>Collab Platform</strong>.
              </p>

              <!-- Room Details Box -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h2 style="margin: 0 0 10px; color: #92400e; font-size: 20px;">
                  ${roomName}
                </h2>
                ${
                  roomDescription
                    ? `
                  <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                    ${roomDescription}
                  </p>
                `
                    : ""
                }
              </div>

              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                Click the button below to accept the invitation and start collaborating!
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>

              <!-- Or Copy Link -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 6px; text-align: center;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                  Or copy this link:
                </p>
                <p style="margin: 0; color: #3b82f6; font-size: 14px; word-break: break-all;">
                  ${inviteUrl}
                </p>
              </div>

              <!-- Expiry Notice -->
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #991b1b; font-size: 14px;">
                  ⏰ <strong>Note:</strong> This invitation will expire in ${expiresInDays} day${
    expiresInDays !== 1 ? "s" : ""
  }.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Collab Platform. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export const getInviteEmailText = ({
  inviterName,
  roomName,
  roomDescription,
  inviteUrl,
  expiresInDays,
}: InviteEmailProps): string => {
  return `
You're Invited!

${inviterName} has invited you to join their collaboration room on Collab Platform.

Room: ${roomName}
${roomDescription ? `Description: ${roomDescription}` : ""}

Click the link below to accept the invitation:
${inviteUrl}

This invitation will expire in ${expiresInDays} day${
    expiresInDays !== 1 ? "s" : ""
  }.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} Collab Platform. All rights reserved.
  `.trim();
};
