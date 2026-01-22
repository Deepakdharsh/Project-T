import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function hasSmtpConfig() {
  return !!(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);
}

export async function sendBookingConfirmationEmail(input: {
  to: string;
  bookingId: string;
  paymentId: string;
  amountRupees: number;
  date: string;
  slots: string[];
}) {
  // Email must be best-effort; failures should not block success flow.
  if (!hasSmtpConfig()) return;

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  const subject = `Booking Confirmed (${input.bookingId})`;
  const text = [
    `Your booking is confirmed.`,
    ``,
    `Booking ID: ${input.bookingId}`,
    `Payment ID: ${input.paymentId}`,
    `Amount Paid: ₹${input.amountRupees}`,
    `Date: ${input.date}`,
    `Time: ${input.slots.join(', ')}`,
    ``,
    `Thank you.`,
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Booking Confirmed</h2>
      <p>Your booking is confirmed.</p>
      <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
        <tr><td><b>Booking ID</b></td><td>${escapeHtml(input.bookingId)}</td></tr>
        <tr><td><b>Payment ID</b></td><td>${escapeHtml(input.paymentId)}</td></tr>
        <tr><td><b>Amount Paid</b></td><td>₹${input.amountRupees}</td></tr>
        <tr><td><b>Date</b></td><td>${escapeHtml(input.date)}</td></tr>
        <tr><td><b>Time</b></td><td>${escapeHtml(input.slots.join(', '))}</td></tr>
      </table>
      <p style="margin-top: 16px;">Thank you.</p>
    </div>
  `;

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: input.to,
    subject,
    text,
    html,
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return ch;
    }
  });
}



