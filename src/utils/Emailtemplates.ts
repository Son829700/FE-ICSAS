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
export function buildOtpEmailBody(params: {
  username: string;
  otp: string;
  expiresMinutes?: number;
}): string {
  const { username, otp, expiresMinutes = 5 } = params;

  // Split OTP into individual digits for display
  const digits = otp.split("").map(
    (d) => `
    <span style="
      display: inline-block;
      width: 44px; height: 52px;
      line-height: 52px;
      text-align: center;
      font-size: 28px;
      font-weight: 700;
      color: #1a56db;
      background: #f0f5ff;
      border: 2px solid #c7d9ff;
      border-radius: 10px;
      margin: 0 4px;
      letter-spacing: 0;
    ">${d}</span>`
  ).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset OTP</title>
</head>
<body style="${BASE_STYLE}">
  <div style="${CARD_STYLE}">

    <!-- Header -->
    <div style="${HEADER_STYLE}">
      <div style="
        width: 56px; height: 56px;
        background: rgba(255,255,255,0.15);
        border-radius: 14px;
        margin: 0 auto 16px;
        display: flex; align-items: center; justify-content: center;
      ">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white" opacity="0"/>
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="white"/>
        </svg>
      </div>
      <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:-0.3px;">
        Password Reset Request
      </h1>
      <p style="margin:8px 0 0; color:rgba(255,255,255,0.75); font-size:13px;">
        ICSAS Analytics Portal
      </p>
    </div>

    <!-- Body -->
    <div style="${BODY_STYLE}">
      <p style="margin:0 0 8px; font-size:16px; font-weight:600; color:#1e293b;">
        Hi, ${username} 👋
      </p>
      <p style="margin:0 0 24px; font-size:14px; color:#64748b; line-height:1.6;">
        We received a request to reset your password. Use the verification code below.
        This code is valid for <strong style="color:#1e293b;">${expiresMinutes} minutes</strong> and can only be used once.
      </p>

      <!-- OTP Box -->
      <div style="
        background: #f8faff;
        border: 1px solid #dbeafe;
        border-radius: 12px;
        padding: 28px 20px;
        text-align: center;
        margin-bottom: 24px;
      ">
        <p style="margin:0 0 16px; font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:1px;">
          Your verification code
        </p>
        <div style="display:inline-flex; gap:0;">
          ${digits}
        </div>
        <p style="margin:16px 0 0; font-size:12px; color:#94a3b8;">
          Expires in ${expiresMinutes} minutes
        </p>
      </div>

      <!-- Warning -->
      <div style="
        background: #fef9ec;
        border: 1px solid #fde68a;
        border-radius: 10px;
        padding: 14px 16px;
        margin-bottom: 24px;
        display: flex;
        gap: 10px;
        align-items: flex-start;
      ">
        <span style="font-size:16px; flex-shrink:0; margin-top:1px;">⚠️</span>
        <p style="margin:0; font-size:13px; color:#92400e; line-height:1.5;">
          If you didn't request a password reset, please ignore this email or
          contact your administrator immediately. Do not share this code with anyone.
        </p>
      </div>

      <p style="margin:0; font-size:13px; color:#94a3b8; line-height:1.6;">
        For security reasons, this code will expire automatically and cannot be reused.
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

/* =======================
   ACCOUNT ACTIVATION EMAIL
   Gửi khi Admin activate tài khoản customer
======================= */
export function buildActivationEmailBody(params: {
  username: string;
  email: string;
  loginUrl?: string;
  shopName?: string;
}): string {
  const {
    username,
    email,
    loginUrl = `${window.location.origin}/signin`,
    shopName,
  } = params;

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
      <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:-0.3px;">
        Your Account is Now Active!
      </h1>
      <p style="margin:8px 0 0; color:rgba(255,255,255,0.75); font-size:13px;">
        ICSAS Analytics Portal
      </p>
    </div>

    <!-- Body -->
    <div style="${BODY_STYLE}">
      <p style="margin:0 0 8px; font-size:16px; font-weight:600; color:#1e293b;">
        Welcome, ${username}! 👋
      </p>
      <p style="margin:0 0 24px; font-size:14px; color:#64748b; line-height:1.6;">
        Great news — your account has been reviewed and activated by our team.
        You now have full access to the ICSAS Analytics Portal.
      </p>

      ${shopName ? `
      <!-- Shop Info -->
      <div style="
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 24px;
      ">
        <p style="margin:0 0 4px; font-size:12px; font-weight:600; color:#16a34a; text-transform:uppercase; letter-spacing:0.5px;">
          Your Shop
        </p>
        <p style="margin:0; font-size:16px; font-weight:700; color:#15803d;">
          ${shopName}
        </p>
      </div>
      ` : ""}

      <!-- Account Info -->
      <div style="
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 28px;
      ">
        <p style="margin:0 0 10px; font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">
          Account Details
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
          <tr>
            <td style="padding:4px 0; font-size:13px; color:#94a3b8;">Status</td>
            <td style="padding:4px 0;">
              <span style="
                display:inline-block;
                background:#dcfce7; color:#16a34a;
                padding:2px 10px; border-radius:20px;
                font-size:12px; font-weight:600;
              ">ACTIVE</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center; margin-bottom:24px;">
        <a href="${loginUrl}" style="
          display: inline-block;
          background: linear-gradient(135deg, #1a56db 0%, #0e3fa6 100%);
          color: #ffffff;
          text-decoration: none;
          padding: 14px 36px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.2px;
        ">
          Sign In to Dashboard →
        </a>
      </div>

      <p style="margin:0; font-size:13px; color:#94a3b8; line-height:1.6; text-align:center;">
        Or copy this link: <a href="${loginUrl}" style="color:#1a56db;">${loginUrl}</a>
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