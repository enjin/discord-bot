import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import { db, schema } from "../db";
import { eq, sql } from "drizzle-orm";

export default {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("List of configured tokens")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async handler(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    }

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "You do not have permission to run this command.", ephemeral: true });
    }

    const server = await db.query.servers.findFirst({
      where: eq(schema.servers.id, interaction.guildId!)
    });

    if (!server) {
      return interaction.reply({ content: "Please setup your server with /setup command", ephemeral: true });
    }

    const tokenRoles = await db
      .select({
        tokenId: schema.serverTokenRoles.tokenId,
        roles: sql<string[]>`JSON_ARRAYAGG(${schema.serverTokenRoles.roleId}) as roles`,
        balance: schema.serverTokenRoles.balance
      })
      .from(schema.serverTokenRoles)
      .where(eq(schema.serverTokenRoles.serverId, interaction.guildId!))
      .groupBy(sql`${schema.serverTokenRoles.tokenId}`)
      .execute();

    const collectionRoles = await db
      .select({
        collectionId: schema.serverCollectionRoles.collectionId,
        roles: sql<string[]>`JSON_ARRAYAGG(${schema.serverCollectionRoles.roleId}) as roles`,
        tokenCount: schema.serverCollectionRoles.tokenCount
      })
      .from(schema.serverCollectionRoles)
      .where(eq(schema.serverCollectionRoles.serverId, interaction.guildId!))
      .groupBy(schema.serverCollectionRoles.collectionId,schema.serverCollectionRoles.tokenCount)
      .execute();

    if (tokenRoles.length === 0 && collectionRoles.length === 0) {
      return interaction.reply({ content: "No roles configured.", ephemeral: true });
    }

    let collectionMessage = collectionRoles.reduce((content, { roles, collectionId, tokenCount }, index) => {
      return (
        content +
        `${index + 1}. ${collectionId} (x${tokenCount}) has role${roles.length === 1 ? "" : "s"} ${roles
          .map((r) => interaction.guild?.roles.cache.get(r))
          .join(", ")}\n`
      );
    }, "");

    if (collectionRoles.length > 0) {
      collectionMessage = "## Collections\n" + collectionMessage;
    }

    if (tokenRoles.length > 0) {
      collectionMessage += "\n## Tokens\n";
    }

    const message = tokenRoles.reduce((content, { roles, tokenId, balance }, index) => {
      return (
        content +
        `${index + 1}. ${tokenId} (x${balance}) has role${roles.length === 1 ? "" : "s"} ${roles
          .map((r) => interaction.guild?.roles.cache.get(r))
          .join(", ")}\n`
      );
    }, collectionMessage);

    return interaction.reply({ content: message, ephemeral: true });
  }
};
