"use client";

import { api } from "@/utils/api";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useState } from "react";

type ApiKey = {
  id: string;
  keyName: string | null;
  createdAt: string | null;
  lastUsedAt: string | null;
};

type ApiKeysResponse = {
  success: boolean;
  data: ApiKey[];
};

type CreateApiKeyResponse = {
  success: boolean;
  apiKey: string;
  data: ApiKey;
};

const apiKeysQueryKey = ["dashboard", "apiKeys"];

function formatDate(value: string | null) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function maskApiKey(key: ApiKey) {
  return `hs_...${key.id.slice(-4)}`;
}

function shortKeyId(id: string) {
  return `key-${id.slice(0, 8)}`;
}

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdApiKey, setCreatedApiKey] = useState<CreateApiKeyResponse | null>(
    null,
  );
  const [hasCopiedApiKey, setHasCopiedApiKey] = useState(false);

  const {
    data: apiKeys = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: apiKeysQueryKey,
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const res = await api.post<ApiKeysResponse>("/api/key/list");
      return res.data.data;
    },
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async (keyName: string) => {
      const res = await api.post<CreateApiKeyResponse>("/api/key/create", {
        keyName,
      });
      return res.data;
    },
    onSuccess: async (createdKey) => {
      if (!createdKey.success) return;

      await queryClient.invalidateQueries({ queryKey: apiKeysQueryKey });

      queryClient.setQueryData<ApiKey[]>(apiKeysQueryKey, (current = []) => {
        const keyExists = current.some((key) => key.id === createdKey.data.id);

        if (!keyExists) {
          return [createdKey.data, ...current];
        }

        return current.map((key) =>
          key.id === createdKey.data.id ? createdKey.data : key,
        );
      });

      setCreatedApiKey(createdKey);
      setHasCopiedApiKey(false);
      setIsModalOpen(false);
      setNewKeyName("");
    },
  });

  function handleGenerateApi() {
    const keyName = newKeyName.trim();
    if (!keyName) return;

    createApiKeyMutation.mutate(keyName);
  }

  async function handleCopyCreatedApiKey() {
    if (!createdApiKey?.apiKey) return;

    await navigator.clipboard.writeText(createdApiKey.apiKey);
    setHasCopiedApiKey(true);
  }

  return (
    <div className="p-8 md:p-10 max-w-[1200px] w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-bold mb-2 tracking-tight">API Keys</h1>
          <p className="text-neutral-400 text-[15px]">
            Manage secret keys to authenticate your webhook deliveries across
            environments.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#fde047] text-black px-4 py-2.5 rounded text-[11px] font-mono font-bold tracking-widest uppercase flex items-center gap-2 hover:bg-[#fce96a] transition-colors shrink-0 shadow-[0_0_15px_-3px_rgba(253,224,71,0.3)]"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} /> CREATE NEW API KEY
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="border border-neutral-800 bg-[#161616] p-6 rounded-md">
          <div className="text-sm text-neutral-200 font-semibold mb-4">
            Active Keys
          </div>
          <div className="text-3xl font-bold text-[#fde047]">
            {!isLoaded || isLoading
              ? "--"
              : apiKeys.length.toString().padStart(2, "0")}
          </div>
        </div>
        <div className="border border-neutral-800 bg-[#161616] p-6 rounded-md">
          <div className="text-sm text-neutral-200 font-semibold mb-4">
            Total Calls (24h)
          </div>
          <div className="text-3xl font-bold text-white">0</div>
        </div>
        <div className="border border-neutral-800 bg-[#161616] p-6 rounded-md">
          <div className="text-sm text-neutral-200 font-semibold mb-4">
            Avg Latency
          </div>
          <div className="text-3xl font-bold text-white">0ms</div>
        </div>
      </div>

      <div className="border-y border-neutral-800 bg-[#111] mb-10">
        <div className="grid grid-cols-12 gap-4 px-1 sm:px-0 py-5 border-b border-neutral-800 text-base font-semibold text-neutral-300">
          <div className="col-span-4">Project</div>
          <div className="col-span-3">API Key</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1" />
        </div>

        {!isLoaded || isLoading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-14 text-sm text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin text-[#fde047]" />
            Loading API keys...
          </div>
        ) : apiKeys.length > 0 ? (
          <div className="divide-y divide-neutral-800">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="grid grid-cols-12 gap-4 px-1 sm:px-0 py-7 items-center hover:bg-white/[0.015] transition-colors"
              >
                <div className="col-span-4 min-w-0">
                  <div className="truncate text-base font-semibold text-[#fde047]">
                    {key.keyName ?? "Untitled Key"}
                  </div>
                  <div className="mt-1 truncate text-sm font-medium text-neutral-500">
                    {shortKeyId(key.id)}
                  </div>
                </div>
                <div className="col-span-3 min-w-0">
                  <div className="truncate text-base font-semibold text-neutral-200">
                    {maskApiKey(key)}
                  </div>
                  <div className="mt-1 truncate text-sm font-medium text-neutral-500">
                    API key
                  </div>
                </div>
                <div className="col-span-2 text-base font-medium text-neutral-300">
                  {formatDate(key.createdAt)}
                </div>
                <div className="col-span-2">
                  <div className="text-base font-semibold text-[#fde047]">
                    Active
                  </div>
                  <div className="mt-1 text-sm font-medium text-neutral-500">
                    Ready to use
                  </div>
                </div>
                <div className="col-span-1 flex justify-end gap-2">
                  <button
                    aria-label="Regenerate API key"
                    className="group relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-neutral-700 transition-opacity group-hover:opacity-100">
                      Regenerate
                    </span>
                  </button>
                  <button
                    aria-label="Delete API key"
                    className="group relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-neutral-700 transition-opacity group-hover:opacity-100">
                      Delete
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-14 text-center text-sm text-neutral-400">
            No API keys created yet.
          </div>
        )}

        {isFetching && !isLoading && (
          <div className="border-t border-neutral-800 px-6 py-2 text-[11px] font-mono uppercase tracking-widest text-neutral-500">
            Refreshing keys...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-neutral-800 bg-[#0d0d0d] rounded-md flex flex-col">
          <div className="flex justify-between items-center px-5 py-3 border-b border-neutral-800 bg-[#161616] rounded-t-md">
            <div className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
              System_Log // Debug
            </div>
            <div className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
              UTC 14:22:01
            </div>
          </div>
          <div className="p-5 font-mono text-xs leading-loose text-neutral-400 overflow-x-auto">
            <div>{`{`}</div>
            <div className="pl-4">
              "event":{" "}
              <span className="text-[#a5d6ff]">"key.authenticated"</span>,
            </div>
            <div className="pl-4">
              "identity": <span className="text-[#a5d6ff]">"Production"</span>,
            </div>
            <div className="pl-4">
              "origin": <span className="text-[#a5d6ff]">"34.112.44.1"</span>,
            </div>
            <div className="pl-4">
              "status": <span className="text-[#79c0ff]">200</span>,
            </div>
            <div className="pl-4">"payload": {`{`}</div>
            <div className="pl-8">
              "trace_id": <span className="text-[#a5d6ff]">"hs_77x8823"</span>,
            </div>
            <div className="pl-8">
              "region": <span className="text-[#a5d6ff]">"us-east-1"</span>
            </div>
            <div className="pl-4">{`}`}</div>
            <div>{`}`}</div>
          </div>
        </div>

        <div className="border border-neutral-800 bg-[#0d0d0d] rounded-md flex flex-col">
          <div className="flex justify-between items-center px-5 py-3 border-b border-neutral-800 bg-[#161616] rounded-t-md">
            <div className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
              System_Log // Stream
            </div>
            <div className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
              UTC 14:22:05
            </div>
          </div>
          <div className="p-5 font-mono text-xs leading-loose text-neutral-400 overflow-x-auto">
            <div>{`{`}</div>
            <div className="pl-4">
              "event":{" "}
              <span className="text-[#a5d6ff]">"webhook.dispatched"</span>,
            </div>
            <div className="pl-4">
              "target":{" "}
              <span className="text-[#a5d6ff]">
                "https://api.partner.com/v1/ingest"
              </span>
              ,
            </div>
            <div className="pl-4">
              "retry_count": <span className="text-[#79c0ff]">0</span>,
            </div>
            <div className="pl-4">
              "key_id":{" "}
              <span className="text-[#a5d6ff]">"hk_live_...f4e2"</span>,
            </div>
            <div className="pl-4">"performance": {`{`}</div>
            <div className="pl-8">
              "resolve": <span className="text-[#a5d6ff]">"2ms"</span>,
            </div>
            <div className="pl-8">
              "ttfb": <span className="text-[#a5d6ff]">"144ms"</span>
            </div>
            <div className="pl-4">{`}`}</div>
            <div>{`}`}</div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-neutral-800 rounded-lg w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Create New API Key</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewKeyName("");
                  createApiKeyMutation.reset();
                }}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <label
                htmlFor="keyName"
                className="block text-sm font-medium text-neutral-400 mb-2"
              >
                Key Name
              </label>
              <input
                id="keyName"
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production, Staging, CI/CD"
                className="w-full bg-[#161616] border border-neutral-800 rounded px-4 py-2.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-colors"
                autoFocus
              />
              {createApiKeyMutation.isError && (
                <p className="mt-2 text-sm text-red-400">
                  Could not create API key. Please try again.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewKeyName("");
                  createApiKeyMutation.reset();
                }}
                className="px-4 py-2 rounded text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/[0.02] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateApi}
                disabled={
                  !isLoaded ||
                  !isSignedIn ||
                  !newKeyName.trim() ||
                  createApiKeyMutation.isPending
                }
                className="bg-[#fde047] text-black px-4 py-2 rounded text-sm font-semibold hover:bg-[#fce96a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-24 flex items-center justify-center gap-2"
              >
                {createApiKeyMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}

      {createdApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-neutral-800 rounded-lg w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-start gap-6 mb-5">
              <div>
                <h2 className="text-xl font-semibold">API Key Created</h2>
                <p className="mt-2 text-sm text-neutral-400">
                  Make sure to keep your API key safe. You won't be able to copy
                  the API key again.
                </p>
              </div>
              <button
                onClick={() => {
                  setCreatedApiKey(null);
                  setHasCopiedApiKey(false);
                }}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 rounded border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
              Store this key somewhere secure before closing this modal.
            </div>

            <div className="mb-6">
              <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                {createdApiKey.data.keyName ?? "API Key"}
              </div>
              <div className="flex items-center gap-2 rounded border border-neutral-800 bg-black p-2">
                <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap px-2 py-1 font-mono text-sm text-neutral-200">
                  {createdApiKey.apiKey}
                </code>
                <button
                  onClick={handleCopyCreatedApiKey}
                  className="shrink-0 bg-[#fde047] text-black px-3 py-2 rounded text-sm font-semibold hover:bg-[#fce96a] transition-colors flex items-center gap-2"
                >
                  {hasCopiedApiKey ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {hasCopiedApiKey ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setCreatedApiKey(null);
                  setHasCopiedApiKey(false);
                }}
                className="px-4 py-2 rounded text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/[0.02] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
