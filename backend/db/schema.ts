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

export const tokenRoles = mysqlTable(
  "token_roles",
  {
    serverId: varchar("server_id", { length: 20 })
      .references(() => servers.id, { onDelete: "cascade" })
      .notNull(),
    tokenId: varchar("token_id", { length: 255 }).notNull(),
    balance: int("balance").notNull().default(1)
  },
  (table) => {
    return {
      token_roles_pk: primaryKey({ name: "token_roles_pk", columns: [table.serverId, table.tokenId] })
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
    tokenCount: int("token_count").notNull().default(1)
  },
  (table) => {
    return {
      collection_roles_pk: primaryKey({ name: "collection_roles_pk", columns: [table.serverId, table.collectionId] })
    };
  }
);

export const roles = mysqlTable(
  "roles",
  {
    roleId: varchar("role_id", { length: 20 }).notNull(),
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
        foreignColumns: [tokenRoles.serverId, tokenRoles.tokenId],
        name: "token_roles_fk"
      }).onDelete("cascade"),
      collection: foreignKey({
        columns: [table.serverId, table.collectionId],
        foreignColumns: [collectionRoles.serverId, collectionRoles.collectionId],
        name: "collection_roles_fk"
      }).onDelete("cascade"),
      uk: unique("roles_uk").on(table.serverId, table.roleId, table.tokenId, table.collectionId)
    };
  }
);

/// relations


export const rolesRelations = relations(roles, ({ one }) => ({
  token: one(tokenRoles, {
    fields: [roles.serverId, roles.tokenId],
    references: [tokenRoles.serverId, tokenRoles.tokenId],
    relationName: "token_roles",
  }),
  collection: one(collectionRoles, {
    fields: [roles.serverId, roles.collectionId],
    references: [collectionRoles.serverId, collectionRoles.collectionId],
    relationName: "collection_roles"
  })
}));

export const collectionRolesRelations = relations(collectionRoles, ({ many }) => ({
  roles: many(roles, {
    relationName: "collection_roles"
  })
}));

export const tokenRolesRelations = relations(tokenRoles, ({ many }) => ({
  roles: many(roles, {
    relationName: "token_roles"
  })
}));