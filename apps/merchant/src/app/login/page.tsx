'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getErrorMessage, merchantLogin } from '@/lib/api';
import { setMerchantShopId, setMerchantToken } from '@/lib/session';

export default function MerchantLoginPage() {
  const router = useRouter();
  const [shopId, setShopId] = useState('demo-shop');
  const [usernameOrEmail, setUsernameOrEmail] = useState('staff@demo.local');
  const [password, setPassword] = useState('password');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await merchantLogin({ shopId, usernameOrEmail, password });
      setMerchantToken(res.session.token);
      setMerchantShopId(shopId);
      router.push('/scan');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh p-4">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Merchant sign in</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            placeholder="Shop ID"
            className="w-full rounded-xl border border-gray-200 px-4 py-3"
            autoComplete="off"
          />
          <input
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder="Username or email"
            className="w-full rounded-xl border border-gray-200 px-4 py-3"
            autoComplete="username"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-gray-200 px-4 py-3"
            autoComplete="current-password"
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  );
}
