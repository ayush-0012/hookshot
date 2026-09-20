import { Hookshot } from "./dist/wrapper.js";

const client = new Hookshot("hs_cd6104dfb888b27");

try {
  const result = await client.ingest(
    "test-endpoint-id",
    { hello: "world", count: 1 },
    ["user.created"],
  );

  console.log("RESULT:", result);
} catch (error) {
  console.error("ERROR:", error instanceof Error ? error.message : error);
}
