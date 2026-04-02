'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { getMembership } from '@/lib/api';
import { clearCustomerToken, getCustomerLoginId, getCustomerToken } from '@/lib/session';

type ApiErrorBody = { error?: { code?: string; message?: string } };

function getErrorMessage(error: unknown): { code?: string; message: string } {
  const maybe = error as ApiErrorBody;
  return {
    code: maybe?.error?.code,
    message: maybe?.error?.message ?? 'Failed to load membership',
  };
}

export default function MembershipPage({ params }: { params: { shopId: string } }) {
  const token = useMemo(() => getCustomerToken(), []);
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | {
        status: 'ready';
        shopName: string;
        displayName: string;
        pointsBalance: number;
        qrValue: string;
      }
  >(() => (token ? { status: 'loading' } : { status: 'error', message: 'Please sign in again.' }));

  const loginId = useMemo(() => getCustomerLoginId(), []);

  const refresh = useCallback(async () => {
    if (!token) return;
    setState({ status: 'loading' });
    try {
      const data = await getMembership(params.shopId, token);
      setState({
        status: 'ready',
        shopName: data.shop.name,
        displayName: data.membership.displayName || loginId || 'Customer',
        pointsBalance: data.membership.pointsBalance,
        qrValue: data.customerQr.value,
      });
    } catch (err: unknown) {
      const parsed = getErrorMessage(err);
      if (parsed.code === 'UNAUTHORIZED') {
        clearCustomerToken();
      }
      setState({ status: 'error', message: parsed.message });
    }
  }, [loginId, params.shopId, token]);

  useEffect(() => {
    if (!token) return;

    getMembership(params.shopId, token)
      .then((data) => {
        setState({
          status: 'ready',
          shopName: data.shop.name,
          displayName: data.membership.displayName || loginId || 'Customer',
          pointsBalance: data.membership.pointsBalance,
          qrValue: data.customerQr.value,
        });
      })
      .catch((err: unknown) => {
        const parsed = getErrorMessage(err);
        if (parsed.code === 'UNAUTHORIZED') {
          clearCustomerToken();
        }
        setState({ status: 'error', message: parsed.message });
      });
  }, [loginId, params.shopId, token]);

  return (
    <main className="min-h-dvh p-4">
      <div className="mx-auto max-w-md space-y-4">
        {state.status === 'loading' ? <p className="text-sm text-gray-600">Loading…</p> : null}

        {state.status === 'error' ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{state.message}</p>
          </div>
        ) : null}

        {state.status === 'ready' ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{state.shopName}</p>
                <h1 className="text-xl font-semibold">{state.displayName}</h1>
              </div>
              <div className="shrink-0 space-x-2">
                <a
                  href={`/shops/${encodeURIComponent(params.shopId)}/membership/edit-name`}
                  className="inline-block rounded-xl border border-gray-200 px-3 py-2 text-sm"
                >
                  Edit
                </a>
                <button
                  onClick={refresh}
                  className="inline-block rounded-xl border border-gray-200 px-3 py-2 text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Points</p>
              <p className="text-3xl font-semibold">{state.pointsBalance}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Show this QR to staff</p>
              <div className="mt-3 flex justify-center">
                <QRCodeCanvas value={state.qrValue} size={240} includeMargin />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
