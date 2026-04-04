'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerMembership } from '@/lib/api';
import { clearCustomerToken, getCustomerToken } from '@/lib/session';

type ApiErrorBody = { error?: { code?: string; message?: string } };

function getError(error: unknown): { code?: string; message: string } {
  const maybe = error as ApiErrorBody;
  return {
    code: maybe?.error?.code,
    message: maybe?.error?.message ?? 'Registration failed',
  };
}

export default function RegisterPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const router = useRouter();
  const token = useMemo(() => getCustomerToken(), []);

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      router.replace(`/shops/${encodeURIComponent(shopId)}/login`);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const normalizedAge = age.trim().length === 0 ? null : Number(age);
    if (normalizedAge !== null && (!Number.isInteger(normalizedAge) || normalizedAge < 0 || normalizedAge > 150)) {
      setError('Age must be an integer between 0 and 150');
      setIsSubmitting(false);
      return;
    }

    try {
      await registerMembership(shopId, token, {
        displayName,
        age: normalizedAge,
        address,
      });
      router.push(`/shops/${encodeURIComponent(shopId)}/membership`);
    } catch (err: unknown) {
      const parsed = getError(err);
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
        <h1 className="text-xl font-semibold">New customer registration</h1>
        <p className="text-sm text-gray-600">
          Complete profile for this shop. If name is empty, phone/email will be used.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-700">Name (optional)</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Customer name"
              className="w-full rounded-xl border border-gray-200 px-4 py-3"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700">Age (optional)</label>
            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 28"
              className="w-full rounded-xl border border-gray-200 px-4 py-3"
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700">Address (optional)</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
              className="w-full rounded-xl border border-gray-200 px-4 py-3"
              autoComplete="street-address"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Complete registration'}
          </button>
        </form>
      </div>
    </main>
  );
}
