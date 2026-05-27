import nodemailer from 'nodemailer';

import { prisma } from '@/lib/prisma';

function getMailTestRedirectTo() {
  const value = process.env.MAIL_TEST_REDIRECT_TO?.trim();
  return value ? value : null;
}

function buildMailDelivery(input: SendMailInput) {
  const redirectTo = getMailTestRedirectTo();
  if (!redirectTo) {
    return {
      actualTo: input.to,
      loggedToAddress: input.to,
      subject: input.subject,
      text: input.text,
      headers: undefined,
    };
  }

  const redirectNote = `このメールはテストモードで ${redirectTo} にリダイレクトされています。\n本来の宛先: ${input.to}`;

  return {
    actualTo: redirectTo,
    loggedToAddress: `${input.to} => ${redirectTo}`,
    subject: `[MAIL TEST to:${input.to}] ${input.subject}`,
    text: `${redirectNote}\n\n${input.text}`,
    headers: {
      'X-Adlib-Original-To': input.to,
      'X-Adlib-Test-Redirect-To': redirectTo,
    },
  };
}

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
  const from = process.env.MAIL_FROM ?? 'no-reply@adlib-go.local';
  const delivery = buildMailDelivery(input);

  const mailLog = await prisma.mailLog.create({
    data: {
      mailType: input.mailType,
      toAddress: delivery.loggedToAddress,
      subject: delivery.subject,
      bodySummary: delivery.text.slice(0, 200),
      status: 'pending',
      createdById: input.createdById,
    },
  });

  try {
    const info = await transporter.sendMail({
      from,
      to: delivery.actualTo,
      subject: delivery.subject,
      text: delivery.text,
      headers: delivery.headers,
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
            to: delivery.actualTo,
            originalTo: input.to,
            subject: delivery.subject,
            preview: delivery.text,
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