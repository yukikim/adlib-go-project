import nodemailer from 'nodemailer';

import { prisma } from '@/lib/prisma';

let cachedTransport: nodemailer.Transporter | null = null;
let mailSendQueue: Promise<void> = Promise.resolve();

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

function getMailSendIntervalMs() {
  const rawValue = process.env.MAIL_SEND_INTERVAL_MS?.trim();
  if (!rawValue) {
    return isSmtpConfigured() ? 1000 : 0;
  }

  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return isSmtpConfigured() ? 1000 : 0;
  }

  return parsedValue;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function enqueueMailSend<T>(task: () => Promise<T>) {
  const run = mailSendQueue.catch(() => undefined).then(task);

  mailSendQueue = run
    .then(async () => {
      const intervalMs = getMailSendIntervalMs();
      if (intervalMs > 0) {
        await wait(intervalMs);
      }
    })
    .catch(() => undefined);

  return run;
}

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
  if (cachedTransport) {
    return cachedTransport;
  }

  if (isSmtpConfigured()) {
    cachedTransport = nodemailer.createTransport({
      pool: true,
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      maxConnections: 1,
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });

    return cachedTransport;
  }

  cachedTransport = nodemailer.createTransport({
    jsonTransport: true,
  });

  return cachedTransport;
}

type SendMailInput = {
  mailType: string;
  to: string;
  replyTo?: string;
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
    const info = await enqueueMailSend(() =>
      transporter.sendMail({
        from,
        to: delivery.actualTo,
        replyTo: input.replyTo,
        subject: delivery.subject,
        text: delivery.text,
        headers: delivery.headers,
      }),
    );

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
