import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// enums
export const userStatus = pgEnum("user_status", ["active", "inactive"]);
export const payloadEventType = pgEnum("payload_event_type", ["web", "api"]);
export const endpointEventType = pgEnum("endpoint_event_type", [
  "webhook",
  "callback",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id"),
  userName: text("user_name").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  hashedApiKey: text("hashed_api_key"),
  keyName: text("key_name"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const payload = pgTable("payload", {
  id: uuid("id").primaryKey().defaultRandom(),
  payloadBody: jsonb("payload_body"),
  eventType: text("event_type"),
  payloadStatus: text("payload_status"),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const endpoint = pgTable("endpoint", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url"),
  eventType: text("event_type").array(),
  endpointStatus: text("endpoint_status"),
  signingKey: text("signing_key"),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const logs = pgTable("logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  endpointId: uuid("endpoint_id").references(() => endpoint.id, {
    onDelete: "cascade",
  }),
  payloadId: uuid("payload_id").references(() => payload.id, {
    onDelete: "cascade",
  }),
  statusCode: integer("status_code"),
  attemptNumber: integer("attempt_number"),
  endpointResponse: text("endpoint_response"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});
