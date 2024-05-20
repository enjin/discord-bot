import { int, mysqlTable, varchar, text, timestamp, primaryKey } from "drizzle-orm/mysql-core";

export const servers = mysqlTable("servers", {
  id: varchar("id", { length: 20 }).primaryKey(), // guildId
  name: text("name"),
  connectedAt: timestamp("connected_at").defaultNow(),
  version: int("version").notNull()
});

export const connectedAccounts = mysqlTable("connected_accounts", {
  id: varchar("id", { length: 41 }).primaryKey(), // serverId-userId
  userId: varchar("user_id", { length: 20 }).notNull(),
  serverId: varchar("server_id", { length: 20 })
    .references(() => servers.id, { onDelete: "cascade" })
    .notNull()
});

export const accountAddress = mysqlTable(
  "account_address",
  {
    address: varchar("address", { length: 49 }).notNull(),
    memberId: varchar("member_id", { length: 41 })
      .references(() => connectedAccounts.id, { onDelete: "cascade" })
      .notNull()
  },
  (table) => {
    return {
      account_address_pk: primaryKey({ name: "account_address_pk", columns: [table.memberId, table.address] })
    };
  }
);

export const tokenRoles = mysqlTable(
  "token_roles",
  {
    serverId: varchar("server_id", { length: 20 })
      .references(() => servers.id, { onDelete: "cascade" })
      .notNull(),
    tokenId: varchar("token_id", { length: 255 }).notNull(),
    balance: int("balance").notNull().default(1),
    roleId: varchar("role_id", { length: 20 }).notNull()
  },
  (table) => {
    return {
      token_roles_pk: primaryKey({ name: "token_roles_pk", columns: [table.serverId, table.tokenId, table.balance] })
    };
  }
);

export const collectionRoles = mysqlTable(
  "collection_roles",
  {
    serverId: varchar("server_id", { length: 20 })
      .references(() => servers.id, { onDelete: "cascade" })
      .notNull(),
    collectionId: varchar("collection_id", { length: 255 }).notNull(),
    tokenCount: int("token_count").notNull().default(1),
    roleId: varchar("role_id", { length: 20 }).notNull()
  },
  (table) => {
    return {
      collection_roles_pk: primaryKey({ name: "collection_roles_pk", columns: [table.serverId, table.collectionId, table.tokenCount] })
    };
  }
);
