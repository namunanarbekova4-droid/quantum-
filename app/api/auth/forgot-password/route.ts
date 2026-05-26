import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: true }); // don't reveal if email exists

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.deleteMany({ where: { email } });
  await prisma.passwordResetToken.create({ data: { email, token, expiresAt } });

  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Reset your Quantum password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080808;color:#fff;padding:40px;border-radius:8px;">
        <div style="font-size:24px;font-weight:bold;color:#C9A84C;margin-bottom:24px;">Quantum</div>
        <h2 style="font-size:20px;margin-bottom:12px;">Reset your password</h2>
        <p style="color:#888;margin-bottom:24px;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#C9A84C;color:#080808;font-weight:bold;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset Password</a>
        <p style="color:#444;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
