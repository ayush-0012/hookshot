import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["sdk/src/wrapper.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
