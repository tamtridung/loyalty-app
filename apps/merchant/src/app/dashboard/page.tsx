'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboard, getErrorCode, getErrorMessage, type DashboardResponse } from '@/lib/api';
import { clearMerchantToken, getMerchantShopId, getMerchantToken } from '@/lib/session';

const ranges: DashboardResponse['range'][] = ['today', 'yesterday', 'last_week', 'last_month'];

export default function DashboardPage() {
  const router = useRouter();
  const token = useMemo(() => getMerchantToken(), []);
  const shopId = useMemo(() => getMerchantShopId(), []);

  const [range, setRange] = useState<DashboardResponse['range']>('today');
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; metrics: DashboardResponse['metrics'] }
  >({ status: 'loading' });

  useEffect(() => {
    if (!token || !shopId) {
      router.replace('/login');
      return;
    }
    getDashboard(shopId, token, range)
      .then((data) => {
        setState({ status: 'ready', metrics: data.metrics });
      })
      .catch((err: unknown) => {
        if (getErrorCode(err) === 'UNAUTHORIZED') {
          clearMerchantToken();
          router.replace('/login');
          return;
        }
        setState({ status: 'error', message: getErrorMessage(err, 'Failed to load dashboard') });
      });
  }, [range, router, shopId, token]);

  return (
    <main className="min-h-dvh p-4">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <button
            onClick={() => router.push('/scan')}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            Scan
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => {
                setState({ status: 'loading' });
                setRange(r);
              }}
              className={
                r === range
                  ? 'rounded-xl bg-black px-3 py-2 text-sm text-white'
                  : 'rounded-xl border border-gray-200 px-3 py-2 text-sm'
              }
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>

        {state.status === 'loading' ? <p className="text-sm text-gray-600">Loading…</p> : null}
        {state.status === 'error' ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{state.message}</p>
          </div>
        ) : null}
        {state.status === 'ready' ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Award transactions</p>
              <p className="text-2xl font-semibold">{state.metrics.awardTransactions}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Points awarded</p>
              <p className="text-2xl font-semibold">{state.metrics.pointsAwarded}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Unique customers</p>
              <p className="text-2xl font-semibold">{state.metrics.uniqueCustomers}</p>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
