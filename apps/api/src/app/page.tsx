export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="w-full max-w-2xl rounded-xl bg-white p-8 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <h1 className="text-2xl font-semibold">API is running</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          This service exposes HTTP endpoints under <span className="font-mono">/api/*</span>.
        </p>
        <div className="mt-6 space-y-2 text-sm">
          <div>
            Try: <a className="underline" href="/api/public/shops/demo-shop/qr">/api/public/shops/demo-shop/qr</a>
          </div>
          <div className="text-zinc-600 dark:text-zinc-400">
            Expected ports: customer <span className="font-mono">:3000</span>, api <span className="font-mono">:3001</span>, merchant <span className="font-mono">:3002</span>
          </div>
        </div>
      </main>
    </div>
  );
}
