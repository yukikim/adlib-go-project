'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function HeaderSignOutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignOut = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('signout failed');
      }
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="xs" onClick={handleSignOut} disabled={isSubmitting}>
      {isSubmitting ? 'ログアウト中...' : 'ログアウト'}
    </Button>
  );
}