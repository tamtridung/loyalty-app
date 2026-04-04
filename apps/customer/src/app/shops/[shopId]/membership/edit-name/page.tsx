'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useState } from 'react';
import { getMembership, updateDisplayName } from '@/lib/api';
import { clearCustomerToken, getCustomerLoginId, getCustomerToken } from '@/lib/session';

type ApiErrorBody = { error?: { code?: string; message?: string } };

function getErrorMessage(error: unknown, fallback: string): { code?: string; message: string } {
  const maybe = error as ApiErrorBody;
  return {
    code: maybe?.error?.code,
    message: maybe?.error?.message ?? fallback,
  };
}

export default function EditNamePage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const router = useRouter();
  const token = useMemo(() => getCustomerToken(), []);
  const loginId = useMemo(() => getCustomerLoginId(), []);

  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace(`/shops/${encodeURIComponent(shopId)}/login`);
      return;
    }

    getMembership(shopId, token)
      .then((data) => {
        setValue(data.membership.displayName || loginId || '');
      })
      .catch((err: unknown) => {
        const parsed = getErrorMessage(err, 'Failed to load profile');
        if (parsed.code === 'UNAUTHORIZED') {
          clearCustomerToken();
          router.replace(`/shops/${encodeURIComponent(shopId)}/login`);
          return;
        }
        if (parsed.code === 'REGISTRATION_REQUIRED') {
          router.replace(`/shops/${encodeURIComponent(shopId)}/register`);
          return;
        }
        setError(parsed.message);
      });
  }, [loginId, router, shopId, token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await updateDisplayName(shopId, token, value);
      router.push(`/shops/${encodeURIComponent(shopId)}/membership`);
    } catch (err: unknown) {
      const parsed = getErrorMessage(err, 'Update failed');
      if (parsed.code === 'UNAUTHORIZED') {
        clearCustomerToken();
        router.replace(`/shops/${encodeURIComponent(shopId)}/login`);
        return;
      }
      setError(parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh p-4">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Display name</h1>
          <Link
            href={`/shops/${encodeURIComponent(shopId)}/membership`}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            Back
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-gray-200 px-4 py-3"
            autoComplete="name"
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </form>

        <p className="text-xs text-gray-600">Leave blank to fall back to your phone/email.</p>
      </div>
    </main>
  );
}
