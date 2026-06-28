import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container grid min-h-screen place-items-center">
      <section className="flex max-w-md flex-col gap-4 rounded-lg border bg-card p-6 text-card-foreground">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-sm text-muted-foreground">This route does not exist in the migrated app.</p>
        <Button asChild>
          <Link href="/">Return home</Link>
        </Button>
      </section>
    </main>
  );
}
