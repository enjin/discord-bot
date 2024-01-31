import { int, mysqlTable, varchar, text, timestamp, json, primaryKey, unique } from "drizzle-orm/mysql-core";

export const servers = mysqlTable("servers", {
  id: varchar("id", { length: 20 }).primaryKey(), // guildId
  name: text("name"),
  email: text("email"),
  connectedAt: timestamp("connected_at").defaultNow(),
  config: json("config").$type<Record<string, string[]>>().default({}),
  version: int("version").default(0)
});

export const accountAddress = mysqlTable(
  "account_address",
  {
    address: varchar("address", { length: 45 }),
    accountId: varchar("member_id", { length: 20 }).references(() => connectedAccounts.id, { onDelete: "cascade" })
  },
  (table) => {
    return {
      account_address_pk: primaryKey({ name: "account_address_pk", columns: [table.accountId, table.address] })
    };
  }
);

export const connectedAccounts = mysqlTable(
  "connected_accounts",
  {
    id: int("id").primaryKey().autoincrement(),
    memberId: varchar("member_id", { length: 20 }),
    serverId: varchar("id", { length: 20 }).references(() => servers.id)
  },
  (table) => {
    return {
      unique_composite: unique().on(table.serverId, table.memberId)
    };
  }
);
