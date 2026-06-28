import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { aiService } from "@/lib/ai-service";
import { getRateLimitKey, rateLimit } from "@/lib/rate-limit";
import { querySchema } from "@/lib/schemas";
import type { QueryResponse } from "@/types/agent";

export async function POST(request: Request) {
  const limit = rateLimit(`query:${getRateLimitKey(request)}`, 12);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const payload = querySchema.parse(await request.json());
    const { data } = await aiService.post<QueryResponse>("/api/query", payload);
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Could not run query");
  }
}
