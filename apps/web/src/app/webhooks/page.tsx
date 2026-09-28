"use client";

import { useWebhooks, webhooksQueryKey } from "@/hooks/useWebhooks";
import { api } from "@/utils/api";
import { Check, Copy, Loader2, Plus, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type CreateEndpointResponse = {
  message: string;
  id: string;
};

function formatDateTime(value: string | null) {
  if (!value) return { date: "-", time: "" };

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "-", time: "" };

  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { date, time };
}

function formatDateTimeString(value: string | null) {
  if (!value) return "-";
  const { date, time } = formatDateTime(value);
  if (!time) return date;
  return `${date} ${time}`;
}

function statusLabel(statusCode: number | null) {
  if (!statusCode) return "Pending";
  if (statusCode >= 200 && statusCode < 300) return "OK";
  if (statusCode >= 400) return "FAIL";
  return "N/A";
}

function statusColor(statusCode: number | null) {
  if (!statusCode) return "text-neutral-400";
  if (statusCode >= 200 && statusCode < 300) return "text-emerald-400";
  if (statusCode >= 400) return "text-red-400";
  return "text-[#fde047]";
}

export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const {
    data: webhooks = [],
    isLoading,
    isFetching,
    isAuthLoading,
    isError,
  } = useWebhooks();
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(
    null,
  );
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState("");
  const [eventTypesInput, setEventTypesInput] = useState("");
  const [endpointFormError, setEndpointFormError] = useState<string | null>(null);
  const [copiedEndpointId, setCopiedEndpointId] = useState(false);
  const retryMutation = useMutation({
    mutationFn: async (webhook: (typeof webhooks)[number]) => {
      if (!webhook.endpointId || !webhook.payloadId) {
        throw new Error("This delivery is missing retry identifiers.");
      }

      await api.post("/api/retry", {
        id: webhook.id,
        endpoint_id: webhook.endpointId,
        payload_id: webhook.payloadId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: webhooksQueryKey });
    },
  });
  const createEndpointMutation = useMutation({
    mutationFn: async (input: { endpoint: string; eventTypes: string[] }) => {
      const response = await api.post<CreateEndpointResponse>(
        "/api/endpoint/create",
        input,
      );
      return response.data;
    },
  });

  useEffect(() => {
    if (!hasInitializedSelection && webhooks.length > 0) {
      setSelectedWebhookId(webhooks[0].id);
      setHasInitializedSelection(true);
    }
  }, [hasInitializedSelection, webhooks]);

  const selectedWebhook = webhooks.find(({ id }) => id === selectedWebhookId);

  async function copyResponse() {
    if (!selectedWebhook?.endpointResponse) return;

    await navigator.clipboard.writeText(selectedWebhook.endpointResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function copyEndpointId() {
    const endpointId = createEndpointMutation.data?.id;
    if (!endpointId) return;

    await navigator.clipboard.writeText(endpointId);
    setCopiedEndpointId(true);
  }

  function handleCreateEndpoint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEndpointFormError(null);

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(endpointUrl.trim());
    } catch {
      setEndpointFormError("Enter a valid endpoint URL.");
      return;
    }

    if (!(["http:", "https:"].includes(parsedUrl.protocol)) || parsedUrl.username || parsedUrl.password) {
      setEndpointFormError("Use an HTTP or HTTPS URL without embedded credentials.");
      return;
    }

    const eventTypes = eventTypesInput
      .split(/[\n,]/)
      .map((eventType) => eventType.trim())
      .filter(Boolean);

    if (eventTypes.length === 0) {
      setEndpointFormError("Enter at least one event type.");
      return;
    }

    createEndpointMutation.mutate({
      endpoint: parsedUrl.toString(),
      eventTypes,
    });
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false);
    setEndpointUrl("");
    setEventTypesInput("");
    setEndpointFormError(null);
    setCopiedEndpointId(false);
    createEndpointMutation.reset();
  }

  const isPanelOpen = Boolean(selectedWebhook);

  return (
    <div className="flex h-[calc(100vh-72px)] overflow-hidden">
      <section
        className={`${selectedWebhook ? "hidden md:flex" : "flex"} min-w-0 flex-1 flex-col bg-[#111]`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-neutral-800 bg-[#0d0d0d] px-6 py-5 md:px-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Webhooks</h1>
            <p className="mt-1 text-xs text-neutral-500">
              Delivery attempts and endpoint responses
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              createEndpointMutation.reset();
              setIsCreateModalOpen(true);
            }}
            className="flex shrink-0 items-center gap-2 rounded bg-[#fde047] px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-[#fce96a]"
          >
            <Plus className="h-4 w-4" /> Create endpoint
          </button>
        </div>

        {isAuthLoading || isLoading || isFetching ? (
          <div className="flex flex-1 items-center justify-center gap-2 p-10 text-sm text-neutral-400">
            <Loader2 className="h-4 w-4 animate-spin text-[#fde047]" /> Loading webhooks...
          </div>
        ) : isError ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="border border-red-900/50 bg-red-950/20 rounded-lg p-10 text-center text-sm text-red-300">
              Failed to load webhooks.
            </div>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="border border-neutral-800 bg-[#161616] rounded-lg p-10 text-center max-w-md">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-neutral-300">
                <Plus className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-white">No webhooks yet</h2>
              <p className="mt-2 text-sm text-neutral-400">
                Create your first endpoint to start receiving real-time event
                payloads.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 border-b border-neutral-800 bg-[#0d0d0d]/60 px-[41px] py-3.5 text-xs font-mono font-medium tracking-wider text-neutral-300 uppercase md:px-[45px]">
              <div className={isPanelOpen ? "col-span-4" : "col-span-3"}>Target URL</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Attempt</div>
              <div className={isPanelOpen ? "col-span-3" : "col-span-4"}>Failure reason</div>
              <div className="col-span-2 text-right">Started at</div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5 md:p-6">
              {webhooks.map((webhook) => {
                const isSelected = webhook.id === selectedWebhookId;
                const color = statusColor(webhook.statusCode);
                const { date, time } = formatDateTime(webhook.startedAt);

                return (
                  <button
                    type="button"
                    key={webhook.id}
                    onClick={() => {
                      setSelectedWebhookId(webhook.id);
                      setCopied(false);
                      retryMutation.reset();
                    }}
                    className={`grid w-full grid-cols-12 items-center gap-4 rounded-lg border px-5 py-4 text-left font-mono text-[13px] transition-all duration-200 ${isSelected ? "border-[#fde047] bg-[#fde047]/[0.03]" : "border-neutral-800 bg-[#161616] hover:border-neutral-600"}`}
                  >
                    <span
                      className={`${isPanelOpen ? "col-span-4" : "col-span-3"} truncate text-neutral-200`}
                    >
                      {webhook.endpointUrl || "Unknown endpoint"}
                    </span>
                    <span className={`col-span-2 ${color}`}>
                      {webhook.statusCode ?? "-"}{" "}
                      {statusLabel(webhook.statusCode)}
                    </span>
                    <span className="col-span-1 text-neutral-300">
                      {webhook.attemptNumber ?? "-"}
                    </span>
                    <span
                      className={`${isPanelOpen ? "col-span-3" : "col-span-4"} truncate text-neutral-400`}
                    >
                      {webhook.failureReason || "-"}
                    </span>
                    <div
                      suppressHydrationWarning
                      className="col-span-2 flex flex-col items-end justify-center text-right font-mono text-[13px] leading-snug"
                    >
                      <span className="font-medium text-neutral-200">{date}</span>
                      {time && (
                        <span className="mt-0.5 text-xs text-neutral-400">
                          {time}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      {selectedWebhook && (
        <aside className="flex w-full shrink-0 flex-col border-l border-neutral-800 bg-[#161616] md:w-105 lg:w-120">
          <div className="flex h-20 items-center justify-between border-b border-neutral-800 bg-[#111] px-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Webhook details
              </h2>
              <p className="mt-1 text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
                Delivery log
              </p>
            </div>
            <div className="flex items-center gap-4">
              {selectedWebhook.statusCode !== null && selectedWebhook.statusCode >= 400 && (
                <button
                  type="button"
                  onClick={() => retryMutation.mutate(selectedWebhook)}
                  disabled={retryMutation.isPending || !selectedWebhook.endpointId || !selectedWebhook.payloadId}
                  className="rounded border border-neutral-700 px-3 py-2 text-xs font-medium text-[#fde047] transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {retryMutation.isPending ? "Queueing…" : "Retry delivery"}
                </button>
              )}
              <button
                type="button"
                aria-label="Close webhook details"
                onClick={() => {
                  setSelectedWebhookId(null);
                  retryMutation.reset();
                }}
                className="text-neutral-500 transition-colors hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {retryMutation.isError && (
            <div className="border-b border-red-900/50 bg-red-950/20 px-6 py-3 text-xs text-red-300">
              {retryMutation.error instanceof Error
                ? retryMutation.error.message
                : "Could not queue this delivery for retry."}
            </div>
          )}
          {retryMutation.isSuccess && (
            <div className="border-b border-emerald-900/50 bg-emerald-950/20 px-6 py-3 text-xs text-emerald-300">
              Retry queued successfully.
            </div>
          )}

          <div className="flex-1 space-y-8 overflow-y-auto p-6">
            <div>
              <div className="mb-4 text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
                Delivery
              </div>
              <div className="space-y-3">
                <div className="rounded-md border border-neutral-800 bg-[#111] p-4">
                  <div className="mb-2 text-xs text-neutral-500">
                    Target URL
                  </div>
                  <div className="break-all font-mono text-sm text-[#fde047]">
                    {selectedWebhook.endpointUrl || "-"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-neutral-800 bg-[#111] p-4">
                    <div className="mb-2 text-xs text-neutral-500">
                      Status
                    </div>
                    <div
                      className={`font-mono text-sm ${statusColor(selectedWebhook.statusCode)}`}
                    >
                      {selectedWebhook.statusCode ?? "-"}{" "}
                      {statusLabel(selectedWebhook.statusCode)}
                    </div>
                  </div>
                  <div className="rounded-md border border-neutral-800 bg-[#111] p-4">
                    <div className="mb-2 text-xs text-neutral-500">
                      Attempt
                    </div>
                    <div className="font-mono text-sm text-neutral-200">
                      {selectedWebhook.attemptNumber ?? "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
                  Endpoint response
                </div>
                <button
                  type="button"
                  onClick={copyResponse}
                  disabled={!selectedWebhook.endpointResponse}
                  className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-[#fde047] uppercase transition-colors hover:text-[#fce96a] disabled:text-neutral-600"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-neutral-800 bg-[#111] p-5 font-mono text-xs leading-relaxed text-neutral-300">
                {selectedWebhook.endpointResponse || "No response body"}
              </pre>
            </div>

            <div>
              <div className="mb-4 text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
                Timing and errors
              </div>
              <div className="space-y-3 rounded-md border border-neutral-800 bg-[#111] p-4 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">Started at</span>
                  <span
                    suppressHydrationWarning
                    className="text-right text-neutral-300"
                  >
                    {formatDateTimeString(selectedWebhook.startedAt)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">Finished at</span>
                  <span
                    suppressHydrationWarning
                    className="text-right text-neutral-300"
                  >
                    {formatDateTimeString(selectedWebhook.finishedAt)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">Failure category</span>
                  <span className="text-right text-red-300">
                    {selectedWebhook.failureCategory || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">Failure reason</span>
                  <span className="max-w-60 text-right text-red-300">
                    {selectedWebhook.failureReason || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-endpoint-title"
            className="w-full max-w-lg rounded-lg border border-neutral-800 bg-[#111] p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="create-endpoint-title" className="text-xl font-semibold">
                  Create endpoint
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Register the URL that should receive your webhook events.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close create endpoint dialog"
                onClick={closeCreateModal}
                className="text-neutral-500 transition-colors hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createEndpointMutation.data ? (
              <div>
                <p className="mb-4 text-sm text-emerald-300">
                  Endpoint created successfully. Save this ID for SDK ingestion.
                </p>
                <div className="flex items-center gap-2 rounded border border-neutral-800 bg-black p-2">
                  <code className="min-w-0 flex-1 break-all px-2 py-1 font-mono text-sm text-neutral-200">
                    {createEndpointMutation.data.id}
                  </code>
                  <button
                    type="button"
                    onClick={copyEndpointId}
                    className="flex shrink-0 items-center gap-2 rounded bg-[#fde047] px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#fce96a]"
                  >
                    {copiedEndpointId ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedEndpointId ? "Copied" : "Copy ID"}
                  </button>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateEndpoint}>
                <label htmlFor="endpoint-url" className="mb-2 block text-sm font-medium text-neutral-300">
                  Endpoint URL
                </label>
                <input
                  id="endpoint-url"
                  type="url"
                  value={endpointUrl}
                  onChange={(event) => setEndpointUrl(event.target.value)}
                  placeholder="https://example.com/webhooks"
                  required
                  className="mb-5 w-full rounded border border-neutral-800 bg-[#161616] px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
                />

                <label htmlFor="endpoint-event-types" className="mb-2 block text-sm font-medium text-neutral-300">
                  Event types
                </label>
                <textarea
                  id="endpoint-event-types"
                  value={eventTypesInput}
                  onChange={(event) => setEventTypesInput(event.target.value)}
                  placeholder="order.created, invoice.paid"
                  required
                  rows={3}
                  className="w-full resize-y rounded border border-neutral-800 bg-[#161616] px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Separate multiple event types with commas or new lines.
                </p>

                {(endpointFormError || createEndpointMutation.isError) && (
                  <p className="mt-4 text-sm text-red-300">
                    {endpointFormError ?? "Could not create endpoint. Please try again."}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="rounded px-4 py-2 text-sm text-neutral-400 transition-colors hover:bg-white/[0.03] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createEndpointMutation.isPending}
                    className="flex min-w-36 items-center justify-center gap-2 rounded bg-[#fde047] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#fce96a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createEndpointMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Create endpoint
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
