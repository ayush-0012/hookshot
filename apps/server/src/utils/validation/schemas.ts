import { z } from "zod";

// Presence/type validation only. URL format + SSRF rules are deferred to
// the frontend + a later create-endpoint hardening pass.
export const createEndpointSchema = z.object({
  endpoint: z.string().min(1, "Endpoint URL is missing"),
  eventTypes: z
    .array(z.string().min(1))
    .min(1, "At least one event type is required"),
});
