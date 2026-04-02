import Link from 'next/link';

export default async function ShopLandingPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;

  return (
    <main className="min-h-dvh p-4">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Welcome</h1>
        <p className="text-sm text-gray-600">Shop: {shopId}</p>

        <Link
          href={`/shops/${encodeURIComponent(shopId)}/login`}
          className="block w-full rounded-xl bg-black px-4 py-3 text-center text-white"
        >
          Continue
        </Link>
      </div>
    </main>
  );
}
