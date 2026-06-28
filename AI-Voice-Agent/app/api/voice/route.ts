import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { aiService } from "@/lib/ai-service";
import { getRateLimitKey, rateLimit } from "@/lib/rate-limit";
import { voiceSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const limit = rateLimit(`voice:${getRateLimitKey(request)}`, 30);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const payload = voiceSchema.parse(await request.json());
    const { data } = await aiService.post("/api/voice", payload);
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Could not update voice");
  }
}
