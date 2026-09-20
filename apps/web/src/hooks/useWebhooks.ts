"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/utils/api";

export type WebhookLog = {
  id: string;
  endpointUrl: string | null;
  statusCode: number | null;
  attemptNumber: number | null;
  endpointResponse: string | null;
  failureCategory: string | null;
  failureReason: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

type WebhooksResponse = {
  logs: WebhookLog[];
};

export const webhooksQueryKey = ["dashboard", "webhooks"];

export function useWebhooks() {
  const { isLoaded, isSignedIn } = useAuth();
  const query = useQuery({
    queryKey: webhooksQueryKey,
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const response = await api.get<WebhooksResponse>(
        "/api/endpoint/webhooks",
      );
      return response.data.logs;
    },
  });

  return { ...query, isAuthLoading: !isLoaded };
}
