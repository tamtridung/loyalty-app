'use client';

import { BrowserMultiFormatReader } from '@zxing/browser';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getMerchantToken } from '@/lib/session';

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getMerchantToken();
    if (!token) {
      router.replace('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    let reader: BrowserMultiFormatReader | null = null;
    let stopped = false;

    async function start() {
      if (!videoRef.current) return;
      setError(null);

      try {
        reader = new BrowserMultiFormatReader();
        await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
          if (stopped) return;
          if (result) {
            stopped = true;
            (reader as unknown as { reset?: () => void } | null)?.reset?.();
            const qr = result.getText();
            router.push(`/award?qr=${encodeURIComponent(qr)}`);
          }
          if (err) {
            const name = (err as { name?: string } | null)?.name;
            if (name !== 'NotFoundException') {
              setError('Camera scan error');
            }
          }
        });
      } catch {
        setError('Camera permission is required to scan');
      }
    }

    start();
    return () => {
      stopped = true;
      (reader as unknown as { reset?: () => void } | null)?.reset?.();
    };
  }, [router]);

  return (
    <main className="min-h-dvh p-4">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Scan customer QR</h1>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black">
          <video ref={videoRef} className="h-[70dvh] w-full object-cover" muted playsInline />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </main>
  );
}
