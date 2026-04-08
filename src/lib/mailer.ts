import nodemailer from 'nodemailer';

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
};

export async function sendMail(input: SendMailInput) {
  const transporter = buildTransport();
  const from = process.env.MAIL_FROM ?? 'no-reply@adolib-go.local';
  const info = await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
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
}