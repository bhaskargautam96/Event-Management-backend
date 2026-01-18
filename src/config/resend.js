import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail({ to, subject, html }) {
  return resend.emails.send({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  });
}
