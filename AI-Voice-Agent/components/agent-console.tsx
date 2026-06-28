"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BotIcon,
  DownloadIcon,
  FileTextIcon,
  HistoryIcon,
  MicIcon,
  MoonIcon,
  PlayIcon,
  SendIcon,
  SettingsIcon,
  SunIcon,
  Trash2Icon,
  UploadIcon,
  Volume2Icon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAgentApi } from "@/hooks/use-agent-api";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { querySchema } from "@/lib/schemas";
import { useAgentStore } from "@/store/agent-store";
import type { VoiceName } from "@/types/agent";
import { voices } from "@/types/agent";
import { createId } from "@/utils/ids";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type QueryFormValues = z.infer<typeof querySchema>;

const progressSteps = [
  "Embedding your question",
  "Searching document memory",
  "Composing grounded answer",
  "Preparing voice response",
];

const panels: Array<{ value: "chat" | "history" | "settings"; icon: LucideIcon }> = [
  { value: "chat", icon: BotIcon },
  { value: "history", icon: HistoryIcon },
  { value: "settings", icon: SettingsIcon },
];

export function AgentConsole() {
  const { status, messages, setStatus, setVoice, addMessage, clearHistory } = useAgentStore();
  const { isLoading, loadStatus, setVoice: saveVoice, uploadPdf, query } = useAgentApi();
  const { resolvedTheme, setTheme } = useTheme();
  const [activePanel, setActivePanel] = useState<"chat" | "history" | "settings">("chat");
  const [dragging, setDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<QueryFormValues>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      query: "",
      voice: status.selected_voice,
    },
  });

  const applyTranscript = useCallback(
    (value: string) => {
      form.setValue("query", value, { shouldValidate: true });
    },
    [form],
  );
  const recorder = useVoiceRecorder(applyTranscript);

  useEffect(() => {
    loadStatus()
      .then(setStatus)
      .catch(() => toast.error("FastAPI service is not reachable yet."));
  }, [loadStatus, setStatus]);

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentStep((step) => Math.min(step + 1, progressSteps.length - 1));
    }, 1400);
    return () => window.clearInterval(timer);
  }, [isLoading]);

  async function handleUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported.");
      return;
    }

    const response = await uploadPdf(file);
    if (response.already) {
      toast.info(response.message ?? "Document already indexed.");
    } else {
      toast.success(`${response.filename} indexed with ${response.chunks} chunks.`);
    }
    setStatus(await loadStatus());
  }

  async function handleVoiceChange(voice: VoiceName) {
    setVoice(voice);
    form.setValue("voice", voice);
    await saveVoice(voice);
  }

  async function onSubmit(values: QueryFormValues) {
    addMessage({
      id: createId("msg"),
      role: "user",
      content: values.query,
      createdAt: new Date().toISOString(),
    });

    const result = await query({ query: values.query, voice: status.selected_voice });
    addMessage({
      id: createId("msg"),
      role: "assistant",
      content: result.text_response,
      createdAt: new Date().toISOString(),
      sources: result.sources,
      audioId: result.audio_id,
    });
    form.reset({ query: "", voice: status.selected_voice });
  }

  const latestAudioId = [...messages].reverse().find((message) => message.audioId)?.audioId;

  return (
    <main className="min-h-screen surface-grid">
      <section className="container flex min-h-screen flex-col gap-8 py-6 lg:py-10">
        <header className="flex flex-col gap-5 rounded-lg border bg-card/90 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-md bg-primary text-primary-foreground">
              <Volume2Icon aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">Voice RAG Agent</p>
              <h1 className="text-2xl font-black tracking-normal md:text-4xl">AI Voice Agent</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.setup_complete ? "default" : "secondary"}>
              {status.setup_complete ? "Documents ready" : "Upload required"}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              aria-label="Toggle dark mode"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
            </Button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon aria-hidden="true" />
                  Knowledge Upload
                </CardTitle>
                <CardDescription>Index PDF documentation before starting a conversation.</CardDescription>
              </CardHeader>
              <CardContent>
                <label
                  className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-background p-6 text-center transition hover:bg-muted"
                  data-dragging={dragging}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    const file = event.dataTransfer.files[0];
                    if (file) void handleUpload(file);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    className="sr-only"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleUpload(file);
                      event.target.value = "";
                    }}
                  />
                  {isLoading ? <Spinner className="size-7" /> : <FileTextIcon aria-hidden="true" />}
                  <span className="text-sm font-semibold">Drop a PDF or browse</span>
                  <span className="text-xs text-muted-foreground">Up to 50 MB. Text is chunked and embedded.</span>
                </label>
                <div className="mt-4 flex flex-wrap gap-2" aria-live="polite">
                  {status.processed_documents.length ? (
                    status.processed_documents.map((document) => (
                      <Badge key={document} variant="outline">
                        {document}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents indexed yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon aria-hidden="true" />
                  Voice Settings
                </CardTitle>
                <CardDescription>Choose the OpenAI TTS voice used by the Python service.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {voices.map((voice) => (
                    <Button
                      key={voice}
                      type="button"
                      variant={status.selected_voice === voice ? "default" : "outline"}
                      onClick={() => void handleVoiceChange(voice)}
                      aria-pressed={status.selected_voice === voice}
                    >
                      {voice}
                    </Button>
                  ))}
                </div>
                {recorder.audioUrl ? (
                  <audio className="w-full" src={recorder.audioUrl} controls aria-label="Recorded voice preview" />
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="min-h-[680px]">
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BotIcon aria-hidden="true" />
                    Conversation
                  </CardTitle>
                  <CardDescription>Ask questions by typing or using the microphone.</CardDescription>
                </div>
                <nav className="flex gap-2" aria-label="Conversation panels">
                  {panels.map(({ value, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={activePanel === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActivePanel(value)}
                    >
                      <Icon data-icon="inline-start" />
                      {value}
                    </Button>
                  ))}
                </nav>
              </div>
            </CardHeader>
            <CardContent className="flex min-h-[560px] flex-col gap-4">
              {activePanel === "chat" ? (
                <>
                  <div className="flex min-h-[320px] flex-col gap-3 overflow-y-auto rounded-lg border bg-background p-4">
                    {messages.length ? (
                      messages.map((message) => (
                        <article
                          key={message.id}
                          className={message.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[90%]"}
                        >
                          <div className="rounded-lg border bg-card p-4">
                            <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                            {message.sources?.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {message.sources.map((source) => (
                                  <Badge key={`${message.id}-${source}`} variant="secondary">
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                            {message.audioId ? (
                              <div className="mt-3 flex flex-col gap-2">
                                <audio controls src={`/api/audio/${message.audioId}`} aria-label="AI voice response" />
                                <Button asChild variant="outline" size="sm">
                                  <a href={`/api/audio/${message.audioId}`} download={`voice-response-${status.selected_voice}.mp3`}>
                                    <DownloadIcon data-icon="inline-start" />
                                    Download MP3
                                  </a>
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="grid min-h-[280px] place-items-center text-center">
                        <div className="flex max-w-sm flex-col gap-2">
                          <PlayIcon className="mx-auto" aria-hidden="true" />
                          <p className="font-semibold">Upload documentation, then ask your first question.</p>
                          <p className="text-sm text-muted-foreground">
                            Answers are grounded in your PDFs and can include generated speech.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="rounded-lg border bg-background p-4" aria-live="polite">
                      <div className="flex flex-col gap-2">
                        {progressSteps.map((step, index) => (
                          <div key={step} className="flex items-center gap-2 text-sm">
                            {index <= currentStep ? <Spinner /> : <span className="size-4 rounded-full border" />}
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup>
                      <Field data-invalid={Boolean(form.formState.errors.query)}>
                        <FieldLabel htmlFor="query">Question</FieldLabel>
                        <Textarea
                          id="query"
                          placeholder={
                            status.setup_complete
                              ? "Ask anything about your uploaded documents..."
                              : "Upload a PDF before asking a question..."
                          }
                          disabled={!status.setup_complete || isLoading}
                          aria-invalid={Boolean(form.formState.errors.query)}
                          {...form.register("query")}
                        />
                        <FieldDescription>
                          {form.formState.errors.query?.message ?? "Press the microphone to dictate a question."}
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant={recorder.isRecording ? "destructive" : "outline"}
                        onClick={() => void recorder.start()}
                      >
                        <MicIcon data-icon="inline-start" />
                        {recorder.isRecording ? "Stop recording" : "Record"}
                      </Button>
                      <Button disabled={!status.setup_complete || isLoading} type="submit">
                        {isLoading ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
                        Ask agent
                      </Button>
                    </div>
                  </form>
                </>
              ) : null}

              {activePanel === "history" ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{messages.length} messages in this browser session.</p>
                    <Button variant="outline" size="sm" onClick={clearHistory}>
                      <Trash2Icon data-icon="inline-start" />
                      Clear
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-3">
                    {messages.map((message) => (
                      <div key={message.id} className="rounded-lg border bg-background p-4">
                        <Badge variant={message.role === "assistant" ? "default" : "secondary"}>{message.role}</Badge>
                        <p className="mt-2 line-clamp-3 text-sm">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activePanel === "settings" ? (
                <div className="flex flex-col gap-5">
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Service status</FieldLabel>
                      <FieldDescription>
                        {status.setup_complete
                          ? "FastAPI has indexed at least one PDF."
                          : "FastAPI is reachable but waiting for a PDF upload."}
                      </FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel>Latest generated audio</FieldLabel>
                      {latestAudioId ? (
                        <audio controls src={`/api/audio/${latestAudioId}`} aria-label="Latest generated voice response" />
                      ) : (
                        <FieldDescription>No generated audio in this session yet.</FieldDescription>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel>Authentication</FieldLabel>
                      <FieldDescription>
                        Auth.js is installed with an empty provider list. Add OAuth or credentials providers in `auth.ts`.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
