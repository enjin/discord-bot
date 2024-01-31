import { migrate } from "drizzle-orm/mysql2/migrator";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import config from "../config";

export const connection = await mysql.createConnection({
  uri: config.dbUrl,
  multipleStatements: true
});

export const db = drizzle(connection, { schema, mode: "default" });

await migrate(db, { migrationsFolder: "./backend/db/drizzle" });

await connection.end();
