import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { enquiriesTable } from "@workspace/db";
import { SubmitEnquiryBody } from "@workspace/api-zod";
import nodemailer from "nodemailer";

async function sendNotificationEmail(enquiry: { name: string; email: string; message: string }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, NOTIFICATION_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !NOTIFICATION_EMAIL) {
    return;
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT ?? "587"),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transporter.sendMail({
    from: SMTP_FROM ?? SMTP_USER,
    to: NOTIFICATION_EMAIL,
    subject: `New enquiry from ${enquiry.name}`,
    text: `Name: ${enquiry.name}\nEmail: ${enquiry.email}\n\n${enquiry.message}`,
    html: `<p><strong>Name:</strong> ${enquiry.name}</p><p><strong>Email:</strong> ${enquiry.email}</p><p><strong>Message:</strong></p><p>${enquiry.message.replace(/\n/g, "<br>")}</p>`,
  });
}

const router: IRouter = Router();

router.post("/enquiries", async (req, res) => {
  const parsed = SubmitEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const [saved] = await db
    .insert(enquiriesTable)
    .values(parsed.data)
    .returning();

  sendNotificationEmail(parsed.data).catch(() => {
    req.log.warn("Email notification not sent — SMTP not configured");
  });

  res.status(201).json(saved);
});

router.get("/enquiries", async (_req, res) => {
  const rows = await db
    .select()
    .from(enquiriesTable)
    .orderBy(enquiriesTable.createdAt);
  res.json(rows);
});

export default router;
