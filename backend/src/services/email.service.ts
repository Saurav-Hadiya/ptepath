import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.resend.apiKey);

export async function sendPasswordResetEmail(toEmail: string, resetLink: string): Promise<void> {
  await resend.emails.send({
    from: env.resend.fromEmail,
    to: toEmail,
    subject: 'Reset your PTEPath password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your PTEPath Password</h2>
        <p>You requested a password reset. Click the button below to set a new password.</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p><strong>This link expires in 10 minutes.</strong></p>
        <p>If you did not request this, ignore this email. Your password will not be changed.</p>
        <hr style="margin-top: 32px;" />
        <p style="color: #6B7280; font-size: 12px;">PTEPath - PTE Exam Practice Platform</p>
      </div>
    `,
  });
}
