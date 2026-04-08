import nodemailer from 'nodemailer';

import { prisma } from '@/lib/prisma';

function buildTransport() {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });
  }

  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

type SendMailInput = {
  mailType: string;
  to: string;
  subject: string;
  text: string;
  createdById?: string;
};

export async function sendMail(input: SendMailInput) {
  const transporter = buildTransport();
  const from = process.env.MAIL_FROM ?? 'no-reply@adolib-go.local';

  const mailLog = await prisma.mailLog.create({
    data: {
      mailType: input.mailType,
      toAddress: input.to,
      subject: input.subject,
      bodySummary: input.text.slice(0, 200),
      status: 'pending',
      createdById: input.createdById,
    },
  });

  try {
    const info = await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });

    await prisma.mailLog.update({
      where: { id: mailLog.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        JSON.stringify(
          {
            mailType: input.mailType,
            to: input.to,
            subject: input.subject,
            preview: input.text,
          },
          null,
          2,
        ),
      );
    }

    return info;
  } catch (error) {
    await prisma.mailLog.update({
      where: { id: mailLog.id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}