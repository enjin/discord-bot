import { int, mysqlTable, varchar, text, timestamp, primaryKey, unique, foreignKey } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

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

export const serverTokenRoles = mysqlTable(
  "server_token_roles",
  {
    serverId: varchar("server_id", { length: 20 })
      .references(() => servers.id, { onDelete: "cascade" })
      .notNull(),
    tokenId: varchar("token_id", { length: 255 }).notNull(),
    balance: int("balance").notNull().default(1)
  },
  (table) => {
    return {
      server_token_roles_pk: primaryKey({ name: "server_token_roles_pk", columns: [table.serverId, table.tokenId] })
    };
  }
);

export const serverCollectionRoles = mysqlTable(
  "server_collection_roles",
  {
    serverId: varchar("server_id", { length: 20 })
      .references(() => servers.id, { onDelete: "cascade" })
      .notNull(),
    collectionId: varchar("collection_id", { length: 255 }).notNull(),
    tokenCount: int("token_count").notNull().default(1)
  },
  (table) => {
    return {
      server_collection_roles_pk: primaryKey({ name: "server_collection_roles_pk", columns: [table.serverId, table.collectionId] })
    };
  }
);

export const serverRoles = mysqlTable(
  "server_roles",
  {
    roleId: varchar("role_id", { length: 20 }),
    initialName: text("initial_name").notNull().default(""),
    createdAt: timestamp("created_at").defaultNow(),
    tokenId: varchar("token_id", { length: 255 }),
    collectionId: varchar("collection_id", { length: 255 }),
    serverId: varchar("server_id", { length: 20 })
      .references(() => servers.id, { onDelete: "cascade" })
      .notNull()
  },
  (table) => {
    return {
      token: foreignKey({
        columns: [table.serverId, table.tokenId],
        foreignColumns: [serverTokenRoles.serverId, serverTokenRoles.tokenId],
        name: "token_roles_fk"
      }).onDelete("cascade"),
      collection: foreignKey({
        columns: [table.serverId, table.collectionId],
        foreignColumns: [serverCollectionRoles.serverId, serverCollectionRoles.collectionId],
        name: "collection_roles_fk"
      }).onDelete("cascade"),
      uk: unique("server_roles_uk").on(table.serverId, table.roleId, table.tokenId, table.collectionId)
    };
  }
);

/// relations

export const serverCollectionRolesRelations = relations(serverCollectionRoles, ({ many }) => ({
  posts: many(serverRoles, {
    relationName: "roles"
  })
}));

export const serverTokenRolesRelations = relations(serverTokenRoles, ({ many }) => ({
  posts: many(serverRoles, {
    relationName: "roles"
  })
}));

export const serverRolesRelations = relations(serverRoles, ({ one }) => ({
  token: one(serverTokenRoles, {
    fields: [serverRoles.serverId, serverRoles.tokenId],
    references: [serverTokenRoles.serverId, serverTokenRoles.tokenId],
    relationName: "token"
  }),
  collection: one(serverCollectionRoles, {
    fields: [serverRoles.serverId, serverRoles.collectionId],
    references: [serverCollectionRoles.serverId, serverCollectionRoles.collectionId],
    relationName: "collection"
  })
}));
