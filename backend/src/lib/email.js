export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Porar Ghor <noreply@resend.dev>',
      to,
      subject: 'পড়ার ঘর — Password Reset',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAF8F3;border-radius:12px;">
          <h1 style="font-family:Georgia,serif;font-size:28px;color:#16201A;margin:0 0 4px;">
            <span style="color:#0D6B4E;">পড়ার ঘর</span>
          </h1>
          <p style="color:#6B7A70;font-size:13px;margin:0 0 28px;">Your interview-prep shelf</p>

          <p style="color:#16201A;font-size:15px;">Hi <strong>${name}</strong>,</p>
          <p style="color:#16201A;font-size:15px;line-height:1.6;">
            We received a request to reset your password. Click the button below — this link expires in <strong>1 hour</strong>.
          </p>

          <a href="${resetUrl}"
            style="display:inline-block;margin:20px 0;background:#0D6B4E;color:#fff;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;">
            Reset Password
          </a>

          <p style="color:#6B7A70;font-size:13px;margin-top:24px;">
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </p>
          <p style="color:#6B7A70;font-size:12px;margin-top:8px;">
            Or copy this link: <br/>
            <span style="word-break:break-all;color:#0D6B4E;">${resetUrl}</span>
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Email send failed: ${err.message || res.statusText}`);
  }
}
