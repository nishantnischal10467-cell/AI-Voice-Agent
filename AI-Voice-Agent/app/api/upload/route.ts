import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { aiService } from "@/lib/ai-service";
import { getRateLimitKey, rateLimit } from "@/lib/rate-limit";
import { uploadSchema } from "@/lib/schemas";
import type { UploadResponse } from "@/types/agent";

export async function POST(request: Request) {
  const limit = rateLimit(`upload:${getRateLimitKey(request)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many uploads. Try again shortly." }, { status: 429 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const parsed = uploadSchema.parse({ file });
    const outbound = new FormData();
    outbound.append("file", parsed.file, parsed.file.name);

    const { data } = await aiService.post<UploadResponse>("/api/upload", outbound);
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Could not upload PDF");
  }
}
