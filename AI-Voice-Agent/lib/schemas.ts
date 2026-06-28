import { z } from "zod";
import { voices } from "@/types/agent";

export const voiceSchema = z.object({
  voice: z.enum(voices),
});

export const querySchema = z.object({
  query: z.string().trim().min(1, "Ask a question first.").max(4000),
  voice: z.enum(voices).optional(),
});

export const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, "Choose a PDF to upload.")
    .refine((file) => file.size <= 50 * 1024 * 1024, "PDFs must be 50 MB or smaller.")
    .refine(
      (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
      "Only PDF files are supported.",
    ),
});
