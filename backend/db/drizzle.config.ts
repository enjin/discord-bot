import { defineConfig } from "drizzle-kit";
import config from "../config";

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
