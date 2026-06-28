export const voices = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "onyx",
  "nova",
  "sage",
  "shimmer",
  "verse",
] as const;

export type VoiceName = (typeof voices)[number];

export type AgentStatus = {
  setup_complete: boolean;
  processed_documents: string[];
  selected_voice: VoiceName;
};

export type UploadResponse = {
  ok?: boolean;
  filename?: string;
  chunks?: number;
  message?: string;
  already?: boolean;
};

export type QueryResponse = {
  text_response: string;
  sources: string[];
  audio_id?: string | null;
};

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: string[];
  audioId?: string | null;
};
