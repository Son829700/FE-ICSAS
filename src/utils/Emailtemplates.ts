// src/utils/emailTemplates.ts
// HTML email templates gửi qua /email/send API

const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f4f7fb;
  margin: 0; padding: 0;
`;

const CARD_STYLE = `
  max-width: 520px;
  margin: 40px auto;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
`;

const HEADER_STYLE = `
  background: linear-gradient(135deg, #1a56db 0%, #0e3fa6 100%);
  padding: 36px 40px 28px;
  text-align: center;
`;

const BODY_STYLE = `
  padding: 36px 40px;
`;

const FOOTER_STYLE = `
  background: #f8fafc;
  border-top: 1px solid #e8edf5;
  padding: 20px 40px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
`;

/* =======================
   OTP EMAIL
   Gửi khi user yêu cầu reset password
======================= */


/* =======================
   ACCOUNT ACTIVATION EMAIL
   Gửi khi Admin activate tài khoản customer
======================= */
export function buildActivationEmailBody(params: {
  username: string;
  email: string;
  shopName?: string;
}): string {
  const {
    username,
    email,
    shopName,
  } = params;

  const domain = "https://icsas.systems/";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Account Activated</title>
</head>
<body style="${BASE_STYLE}">
  <div style="${CARD_STYLE}">

    <!-- Header -->
    <div style="${HEADER_STYLE}">
      <div style="
        width: 64px; height: 64px;
        background: rgba(255,255,255,0.15);
        border-radius: 50%;
        margin: 0 auto 16px;
        line-height: 64px;
        text-align: center;
        font-size: 30px;
      ">🎉</div>
      <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700;">
        Account Activated Successfully
      </h1>
      <p style="margin:8px 0 0; color:rgba(255,255,255,0.75); font-size:13px;">
        ICSAS Analytics Portal
      </p>
    </div>

    <!-- Body -->
    <div style="${BODY_STYLE}">
      <p style="margin:0 0 8px; font-size:16px; font-weight:600; color:#1e293b;">
        Hi ${username} 👋
      </p>

      <p style="margin:0 0 20px; font-size:14px; color:#64748b; line-height:1.6;">
        Your account has been successfully activated. You can now access the system using your registered credentials.
      </p>

      ${
        shopName
          ? `
      <div style="
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 10px;
        padding: 14px;
        margin-bottom: 20px;
      ">
        <p style="margin:0; font-size:13px; color:#15803d;">
          <strong>Assigned Shop:</strong> ${shopName}
        </p>
      </div>
      `
          : ""
      }

      <!-- Account Info -->
      <div style="
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 14px;
        margin-bottom: 20px;
      ">
        <p style="margin:0 0 8px; font-size:12px; font-weight:600; color:#64748b;">
          ACCOUNT INFORMATION
        </p>
        <p style="margin:0; font-size:13px; color:#1e293b;">
          <strong>Username:</strong> ${username}
        </p>
        <p style="margin:4px 0 0; font-size:13px; color:#1e293b;">
          <strong>Email:</strong> ${email}
        </p>
      </div>

      <!-- Domain Link -->
      <div style="
        text-align:center;
        background:#eef2ff;
        border:1px solid #c7d2fe;
        border-radius:10px;
        padding:16px;
      ">
        <p style="margin:0 0 8px; font-size:13px; color:#4338ca;">
          Access the system here:
        </p>
        <a href="${domain}" style="
          font-size:14px;
          font-weight:600;
          color:#1a56db;
          text-decoration:none;
        ">
          ${domain}
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="${FOOTER_STYLE}">
      <p style="margin:0 0 4px;">
        © ${new Date().getFullYear()} ICSAS
      </p>
      <p style="margin:0;">
        This is an automated email. Do not reply.
      </p>
    </div>

  </div>
</body>
</html>`;
}

/* =======================
   SIGNUP NOTIFICATION EMAIL
   Gửi khi customer đăng ký thành công, thông báo tài khoản đang chờ duyệt
======================= */
export function buildSignupNotificationEmailBody(params: {
  username: string;
  email: string;
}): string {
  const { username, email } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Registration Received</title>
</head>
<body style="${BASE_STYLE}">
  <div style="${CARD_STYLE}">

    <!-- Header -->
    <div style="${HEADER_STYLE}">
      <div style="font-size:36px; margin-bottom:12px; line-height:1;">📬</div>
      <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:-0.3px;">
        Registration Received
      </h1>
      <p style="margin:8px 0 0; color:rgba(255,255,255,0.75); font-size:13px;">
        ICSAS Analytics Portal
      </p>
    </div>

    <!-- Body -->
    <div style="${BODY_STYLE}">
      <p style="margin:0 0 8px; font-size:16px; font-weight:600; color:#1e293b;">
        Hi, ${username}!
      </p>
      <p style="margin:0 0 24px; font-size:14px; color:#64748b; line-height:1.6;">
        Thank you for registering with ICSAS. We've received your request and
        our team will review your account shortly.
      </p>

      <!-- Status Banner -->
      <div style="
        background: #fef9ec;
        border: 1px solid #fde68a;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
        text-align: center;
      ">
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fef3c7;
          border-radius: 20px;
          padding: 6px 16px;
          margin-bottom: 10px;
        ">
          <span style="width:8px;height:8px;background:#f59e0b;border-radius:50%;display:inline-block;"></span>
          <span style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">
            Pending Review
          </span>
        </div>
        <p style="margin:0; font-size:14px; color:#78350f; line-height:1.5;">
          Your account is currently <strong>inactive</strong>. You will receive
          another email once an administrator activates your account.
        </p>
      </div>

      <!-- Account Info -->
      <div style="
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 24px;
      ">
        <p style="margin:0 0 10px; font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">
          Your Registration Info
        </p>
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="padding:4px 0; font-size:13px; color:#94a3b8; width:40%;">Username</td>
            <td style="padding:4px 0; font-size:13px; color:#1e293b; font-weight:500;">${username}</td>
          </tr>
          <tr>
            <td style="padding:4px 0; font-size:13px; color:#94a3b8;">Email</td>
            <td style="padding:4px 0; font-size:13px; color:#1e293b; font-weight:500;">${email}</td>
          </tr>
        </table>
      </div>

      <p style="margin:0; font-size:13px; color:#94a3b8; line-height:1.6;">
        If you have any questions, please contact your account manager or system administrator.
      </p>
    </div>

    <!-- Footer -->
    <div style="${FOOTER_STYLE}">
      <p style="margin:0 0 4px;">
        © ${new Date().getFullYear()} ICSAS · Internal Customer Analytics System
      </p>
      <p style="margin:0; color:#cbd5e1;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>

  </div>
</body>
</html>`;
}