import { db, schema } from "../db";
import { eq } from "drizzle-orm";

export async function setupGuild(guildId: string, guildName: string) {
  const server = await db.query.servers.findFirst({
    where: eq(schema.servers.id, guildId)
  });

  if (!server) {
    await db.insert(schema.servers).values({ id: guildId, name: guildName, version: 1 }).execute();
  }
}

export async function getServerOrFail(guildId: string) {
  const server = await db.query.servers.findFirst({
    where: eq(schema.servers.id, guildId)
  });

  if (!server) {
    throw new Error("Server not found in database");
  }

  return server;
}
