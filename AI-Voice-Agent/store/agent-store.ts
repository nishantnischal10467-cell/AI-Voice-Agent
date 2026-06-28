"use client";

import { create } from "zustand";
import type { AgentStatus, ConversationMessage, VoiceName } from "@/types/agent";

type AgentState = {
  status: AgentStatus;
  messages: ConversationMessage[];
  setStatus: (status: AgentStatus) => void;
  setVoice: (voice: VoiceName) => void;
  addMessage: (message: ConversationMessage) => void;
  clearHistory: () => void;
};

export const useAgentStore = create<AgentState>((set) => ({
  status: {
    setup_complete: false,
    processed_documents: [],
    selected_voice: "coral",
  },
  messages: [],
  setStatus: (status) => set({ status }),
  setVoice: (voice) =>
    set((state) => ({
      status: { ...state.status, selected_voice: voice },
    })),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearHistory: () => set({ messages: [] }),
}));
