'use client';

import { Suspense } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { awardPoints, getAwardConfig, getErrorCode, getErrorMessage } from '@/lib/api';
import { clearMerchantToken, getMerchantShopId, getMerchantToken } from '@/lib/session';

function AwardPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const qr = params.get('qr') ?? '';

  const token = useMemo(() => getMerchantToken(), []);
  const shopId = useMemo(() => getMerchantShopId(), []);

  const [config, setConfig] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | {
        status: 'ready';
        defaultAwardPoints: number;
        presets: number[];
        dailyLimit: number;
      }
  >({ status: 'loading' });

  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !shopId) {
      router.replace('/login');
      return;
    }

    getAwardConfig(shopId, token)
      .then((data) => {
        setConfig({
          status: 'ready',
          defaultAwardPoints: data.defaultAwardPoints,
          presets: data.awardPresets,
          dailyLimit: data.dailyAwardLimitPerCustomer,
        });
      })
      .catch((err: unknown) => {
        if (getErrorCode(err) === 'UNAUTHORIZED') {
          clearMerchantToken();
        }
        setConfig({ status: 'error', message: getErrorMessage(err, 'Failed to load config') });
      });
  }, [router, token, shopId]);

  async function submit(points: number) {
    if (!token || !shopId) return;
    if (!qr) {
      setMessage({ kind: 'error', text: 'Missing QR value' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await awardPoints(shopId, token, { customerQrValue: qr, points });
      setMessage({ kind: 'success', text: `Awarded +${res.transaction.pointsAwarded} points` });
    } catch (err: unknown) {
      const code = getErrorCode(err);
      if (code === 'UNAUTHORIZED') {
        clearMerchantToken();
        router.replace('/login');
        return;
      }
      setMessage({ kind: 'error', text: getErrorMessage(err, 'Award failed') });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh p-4">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Award points</h1>
          <button
            onClick={() => router.push('/scan')}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            Scan again
          </button>
        </div>

        {config.status === 'loading' ? <p className="text-sm text-gray-600">Loading…</p> : null}
        {config.status === 'error' ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{config.message}</p>
          </div>
        ) : null}

        {config.status === 'ready' ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Daily limit per customer</p>
              <p className="text-lg font-semibold">{config.dailyLimit}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={isSubmitting}
                onClick={() => submit(config.defaultAwardPoints)}
                className="rounded-2xl bg-black px-4 py-4 text-white disabled:opacity-50"
              >
                +{config.defaultAwardPoints}
              </button>
              {config.presets.slice(0, 3).map((p) => (
                <button
                  key={p}
                  disabled={isSubmitting}
                  onClick={() => submit(p)}
                  className="rounded-2xl border border-gray-200 px-4 py-4 disabled:opacity-50"
                >
                  +{p}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {message ? (
          <div
            className={
              message.kind === 'success'
                ? 'rounded-xl border border-green-200 bg-green-50 p-4'
                : 'rounded-xl border border-red-200 bg-red-50 p-4'
            }
          >
            <p className={message.kind === 'success' ? 'text-sm text-green-800' : 'text-sm text-red-700'}>
              {message.text}
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function AwardPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-gray-600">Loading…</p>}>
      <AwardPageInner />
    </Suspense>
  );
}
