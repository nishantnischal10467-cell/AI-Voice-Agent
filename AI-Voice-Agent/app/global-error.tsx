"use client";

import "@/styles/globals.css";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center p-6">
          <section className="flex max-w-md flex-col gap-4 rounded-lg border bg-card p-6">
            <h1 className="text-2xl font-bold">Application error</h1>
            <p className="text-sm text-muted-foreground">Reload the interface and try again.</p>
            <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={reset}>
              Reload
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
