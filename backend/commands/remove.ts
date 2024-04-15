import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import { db, schema } from "../db";
import { and, eq } from "drizzle-orm";
import { setupGuild } from "../util/server";
import manageUserRoles from "@/util/manager";
import { client } from "@/bot";

export default {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove roles from the token or collection")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) => option.setName("collection").setDescription("Enter collection ID").setRequired(true))
    .addStringOption((option) => option.setName("asset").setDescription("Enter Asset ID"))
    .setDMPermission(false),

  async handler(interaction: ChatInputCommandInteraction) {
    setupGuild(interaction.guildId as string, interaction.guild?.name ?? "");
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    }

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "You do not have permission to run this command.", ephemeral: true });
    }

    const collectionId = interaction.options.getString("collection", true).trim();
    const tokenId = interaction.options.getString("asset", false);

    const accounts = await db.query.connectedAccounts
      .findMany({
        columns: {
          userId: true
        },
        where: (connectedAccounts, { eq }) => eq(connectedAccounts.serverId, interaction.guildId)
      })
      .execute();

    if (tokenId !== null) {
      const assetId = `${collectionId}-${tokenId.trim()}`;

      await db
        .delete(schema.tokenRoles)
        .where(and(eq(schema.tokenRoles.serverId, interaction.guildId), eq(schema.tokenRoles.tokenId, assetId)))
        .execute();

      for (const account of accounts) {
        manageUserRoles(client, interaction.guildId, account.userId);
      }

      return interaction.reply({ content: `Roles removed for ${assetId}`, ephemeral: true });
    } else {
      await db
        .delete(schema.collectionRoles)
        .where(and(eq(schema.collectionRoles.serverId, interaction.guildId), eq(schema.collectionRoles.collectionId, collectionId)))
        .execute();

      for (const account of accounts) {
        manageUserRoles(client, interaction.guildId, account.userId);
      }

      return interaction.reply({ content: `Roles removed for ${collectionId}`, ephemeral: true });
    }
  }
};
