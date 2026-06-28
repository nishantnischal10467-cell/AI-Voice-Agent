"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container grid min-h-screen place-items-center">
      <section className="flex max-w-md flex-col gap-4 rounded-lg border bg-card p-6 text-card-foreground">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">The agent interface hit an unexpected error.</p>
        <Button onClick={reset}>Try again</Button>
      </section>
    </main>
  );
}
