import { int, mysqlTable, varchar, text, timestamp, primaryKey, unique, index } from "drizzle-orm/mysql-core";

export const servers = mysqlTable("servers", {
  id: varchar("id", { length: 20 }).primaryKey(), // guildId
  name: text("name"),
  email: text("email"),
  connectedAt: timestamp("connected_at").defaultNow(),
  version: int("version").notNull()
});


export const connectedAccounts = mysqlTable(
  "connected_accounts",
  {
    memberId: varchar("member_id", { length: 20 }).notNull(),
    serverId: varchar("server_id", { length: 20 })
      .references(() => servers.id, { onDelete: "cascade" })
      .notNull()
  },
  (table) => {
    return {
      member_id_index : index("member_id_index").on(table.memberId),
      connected_accounts_pk: primaryKey({ name: "connected_accounts_pk", columns: [table.serverId, table.memberId] })
    };
  }
);

export const accountAddress = mysqlTable(
  "account_address",
  {
    address: varchar("address", { length: 45 }).notNull(),
    accountId: varchar("member_id", { length: 20 })
      .references(() => connectedAccounts.memberId, { onDelete: "cascade" })
      .notNull()
  },
  (table) => {
    return {
      account_address_pk: primaryKey({ name: "account_address_pk", columns: [table.accountId, table.address] })
    };
  }
);

export const serverTokenRoles = mysqlTable(
  "server_token_roles",
  {
    serverId: varchar("server_id", { length: 20 })
      .references(() => servers.id, { onDelete: "cascade" })
      .notNull(),
    tokenId: varchar("token_id", { length: 255 }).notNull(),
    roleId: varchar("role_id", { length: 20 }).notNull()
  },
  (table) => {
    return {
      unique: unique("server_token_roles_unique").on(table.serverId, table.roleId, table.tokenId)
    };
  }
);
