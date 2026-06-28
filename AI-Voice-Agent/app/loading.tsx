import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="container flex min-h-screen flex-col gap-4 py-10">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </main>
  );
}
