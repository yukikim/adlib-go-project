'use client';

import { FormEvent, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MESSAGE_MAX_LENGTH = 2_000;

type SubmissionState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [messageLength, setMessageLength] = useState(0);
  const [submission, setSubmission] = useState<SubmissionState>({ status: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmission({ status: 'submitting' });

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      subject: String(formData.get('subject') ?? ''),
      message: String(formData.get('message') ?? ''),
      website: String(formData.get('website') ?? ''),
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? 'お問い合わせを送信できませんでした。');
      }

      formRef.current?.reset();
      setMessageLength(0);
      setSubmission({
        status: 'success',
        message: data?.message ?? 'お問い合わせを受け付けました。',
      });
    } catch (error) {
      setSubmission({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'お問い合わせを送信できませんでした。時間をおいて再度お試しください。',
      });
    }
  }

  const isSubmitting = submission.status === 'submitting';

  return (
    <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">お名前</Label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            maxLength={80}
            required
            disabled={isSubmitting}
            className="h-12 rounded-none border-[#153027]/30 bg-[#f4eddf]/60 text-[#153027]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">メールアドレス</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            required
            disabled={isSubmitting}
            className="h-12 rounded-none border-[#153027]/30 bg-[#f4eddf]/60 text-[#153027]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-subject">件名</Label>
        <Input
          id="contact-subject"
          name="subject"
          maxLength={120}
          required
          disabled={isSubmitting}
          className="h-12 rounded-none border-[#153027]/30 bg-[#f4eddf]/60 text-[#153027]"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between gap-4">
          <Label htmlFor="contact-message">お問い合わせ内容</Label>
          <span id="contact-message-count" className="text-xs text-muted-foreground">
            {messageLength.toLocaleString('ja-JP')} /{' '}
            {MESSAGE_MAX_LENGTH.toLocaleString('ja-JP')}文字
          </span>
        </div>
        <Textarea
          id="contact-message"
          name="message"
          className="min-h-48 resize-y rounded-none border-[#153027]/30 bg-[#f4eddf]/60 text-[#153027]"
          minLength={10}
          maxLength={MESSAGE_MAX_LENGTH}
          aria-describedby="contact-message-help contact-message-count"
          required
          disabled={isSubmitting}
          onChange={(event) => setMessageLength(event.currentTarget.value.length)}
        />
        <p id="contact-message-help" className="text-xs leading-5 text-muted-foreground">
          10文字以上、{MESSAGE_MAX_LENGTH.toLocaleString('ja-JP')}
          文字以内で入力してください。
        </p>
      </div>

      <div
        className="pointer-events-none absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <Label htmlFor="contact-website">Webサイト</Label>
        <Input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {submission.status === 'success' ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-700/30 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          {submission.message}
        </div>
      ) : null}
      {submission.status === 'error' ? (
        <div
          role="alert"
          className="rounded-lg border border-red-700/30 bg-red-50 p-3 text-sm text-red-900"
        >
          {submission.message}
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="min-h-12 rounded-none border-[#153027] bg-[#153027] px-6 text-xs font-bold tracking-[0.12em] text-[#f4eddf] hover:bg-[#23463a]"
        disabled={isSubmitting}
      >
        {isSubmitting ? '送信中…' : 'お問い合わせを送信'}
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        入力内容は運営宛てのメール送信にのみ使用します。送信後、控えメールは自動送信されません。
      </p>
    </form>
  );
}
