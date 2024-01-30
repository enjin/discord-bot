import { defineConfig } from "drizzle-kit";
import config from "../config";

console.log("Using database URL:", config.dbUrl);

export default defineConfig({
  schema: "./backend/db/schema.ts",
  out: "./backend/db/drizzle",
  driver: "mysql2",
  dbCredentials: {
    uri: config.dbUrl
  },
  verbose: true,
  strict: true
});
