import nodemailer from 'nodemailer'

export async function sendPasswordResetEmail(email, resetLink) {
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!smtpUser || !smtpPass) {
    console.log('=========================================')
    console.log(` PASSWORD RESET EMAIL FOR: ${email}`)
    console.log(`Reset Link: ${resetLink}`)
    console.log('=========================================')
    return { success: true, mocked: true }
  }

  // Configure nodemailer with Gmail SMTP service
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })

  const mailOptions = {
    from: `"CraftConnect" <${smtpUser}>`,
    to: email,
    subject: 'Reset your CraftConnect password',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 40px 20px; background-color: #FAF7F0; border-radius: 24px;">
        <div style="background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); border: 1px solid rgba(224, 122, 95, 0.1);">
          <div style="margin-bottom: 24px; text-align: center;">
            <span style="font-family: Georgia, serif; font-size: 28px; font-weight: bold; color: #2D3748; letter-spacing: -0.5px;">
              CraftConnect<span style="color: #81B29A;">.</span>
            </span>
          </div>
          
          <h2 style="color: #2D3748; font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 16px;">
            Reset Your Password
          </h2>
          
          <p style="color: #718096; font-size: 14px; line-height: 22px; text-align: center; margin-bottom: 30px;">
            You requested to reset your password. Click the button below to choose a new one. This link will expire in 1 hour.
          </p>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${resetLink}" style="background-color: #81B29A; color: #ffffff; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(129, 178, 154, 0.3); transition: background-color 0.2s;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #A0AEC0; font-size: 12px; text-align: center; margin-bottom: 0;">
            If you did not request this, you can safely ignore this email.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E2E8F0; text-align: center;">
            <p style="color: #A0AEC0; font-size: 11px; margin-bottom: 8px;">
              If the button above does not work, copy and paste this URL into your browser:
            </p>
            <p style="color: #81B29A; font-size: 11px; word-break: break-all; margin: 0;">
              ${resetLink}
            </p>
          </div>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
  return { success: true, mocked: false }
}
