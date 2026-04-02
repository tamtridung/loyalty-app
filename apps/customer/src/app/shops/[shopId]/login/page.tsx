'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { customerLogin } from '@/lib/api';
import { setCustomerLoginId, setCustomerToken } from '@/lib/session';

type ApiErrorBody = { error?: { code?: string; message?: string } };

function getErrorMessage(error: unknown): string {
  const maybe = error as ApiErrorBody;
  return maybe?.error?.message ?? 'Login failed';
}

export default function CustomerLoginPage({ params }: { params: { shopId: string } }) {
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await customerLogin(loginId);
      setCustomerToken(result.session.token);
      setCustomerLoginId(result.customer.loginId);
      router.push(`/shops/${encodeURIComponent(params.shopId)}/membership`);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh p-4">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-gray-600">Enter phone or email. No OTP.</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="Phone or email"
            className="w-full rounded-xl border border-gray-200 px-4 py-3"
            autoComplete="email"
            inputMode="email"
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting || loginId.trim().length === 0}
            className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  );
}
