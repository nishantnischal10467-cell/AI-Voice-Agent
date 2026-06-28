import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { aiService } from "@/lib/ai-service";
import { getRateLimitKey, rateLimit } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ filename: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const limit = rateLimit(`audio:${getRateLimitKey(request)}`, 60);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { filename } = await context.params;
    const upstream = await aiService.get<ArrayBuffer>(`/api/audio/${encodeURIComponent(filename)}`, {
      responseType: "arraybuffer",
    });
    return new NextResponse(upstream.data, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return apiError(error, "Could not load audio");
  }
}
