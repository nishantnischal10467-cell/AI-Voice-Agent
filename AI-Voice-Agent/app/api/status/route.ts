import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { aiService } from "@/lib/ai-service";
import { getRateLimitKey, rateLimit } from "@/lib/rate-limit";
import type { AgentStatus } from "@/types/agent";

export async function GET(request: Request) {
  const limit = rateLimit(`status:${getRateLimitKey(request)}`, 60);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { data } = await aiService.get<AgentStatus>("/api/status");
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error, "Could not load agent status");
  }
}
