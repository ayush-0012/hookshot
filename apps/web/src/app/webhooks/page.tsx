"use client";

import { useWebhooks } from "@/hooks/useWebhooks";
import { Check, Copy, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

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

  const isPanelOpen = Boolean(selectedWebhook);

  return (
    <div className="flex h-[calc(100vh-72px)] overflow-hidden">
      <section
        className={`${selectedWebhook ? "hidden md:flex" : "flex"} min-w-0 flex-1 flex-col bg-[#111]`}
      >
        <div className="border-b border-neutral-800 bg-[#0d0d0d] px-6 py-5 md:px-8">
          <h1 className="text-xl font-bold tracking-tight">Webhooks</h1>
          <p className="mt-1 text-xs text-neutral-500">
            Delivery attempts and endpoint responses
          </p>
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
            <button
              type="button"
              aria-label="Close webhook details"
              onClick={() => setSelectedWebhookId(null)}
              className="text-neutral-500 transition-colors hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

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
    </div>
  );
}
