import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import config from "../config";

export const connection = mysql.createPool({
  uri: config.dbUrl,
  multipleStatements: true
});

export const db = drizzle(connection, { schema, mode: "default" });

export { schema };
