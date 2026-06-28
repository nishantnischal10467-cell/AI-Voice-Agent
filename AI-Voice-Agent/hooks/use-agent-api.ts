"use client";

import axios from "axios";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AgentStatus, QueryResponse, UploadResponse, VoiceName } from "@/types/agent";

const client = axios.create({ baseURL: "/api", timeout: 130000 });

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error || error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

export function useAgentApi() {
  const [isLoading, setIsLoading] = useState(false);

  const loadStatus = useCallback(async () => {
    const { data } = await client.get<AgentStatus>("/status");
    return data;
  }, []);

  const setVoice = useCallback(async (voice: VoiceName) => {
    const { data } = await client.post<{ ok: boolean; voice: VoiceName }>("/voice", { voice });
    return data;
  }, []);

  const uploadPdf = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await client.post<UploadResponse>("/upload", form);
      return data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const query = useCallback(async (payload: { query: string; voice: VoiceName }) => {
    setIsLoading(true);
    try {
      const { data } = await client.post<QueryResponse>("/query", payload);
      return data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, loadStatus, setVoice, uploadPdf, query };
}
