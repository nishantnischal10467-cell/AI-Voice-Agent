import { AxiosError } from "axios";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

export function apiError(error: unknown, fallback = "Request failed") {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  if (error instanceof AxiosError) {
    const detail = error.response?.data as { detail?: string; error?: string } | undefined;
    const message = detail?.detail || detail?.error || error.message || fallback;
    logger.error("upstream_api_error", { status: error.response?.status, message });
    return NextResponse.json({ error: message }, { status: error.response?.status ?? 502 });
  }

  const message = error instanceof Error ? error.message : fallback;
  logger.error("api_error", { message });
  return NextResponse.json({ error: message }, { status: 500 });
}
