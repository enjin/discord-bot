import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";

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
      where: eq(schema.servers.id, interaction.guildId)
    });

    if (!server) {
      return interaction.reply({ content: "Please setup your server with /setup command", ephemeral: true });
    }

    const tokenRoles = await db.query.tokenRoles.findMany({
      where: (tokenRoles, { eq }) => eq(tokenRoles.serverId, interaction.guildId)
    });

    const collectionRoles = await db.query.collectionRoles.findMany({
      where: (collectionRoles, { eq }) => eq(collectionRoles.serverId, interaction.guildId)
    });

    if (tokenRoles.length === 0 && collectionRoles.length === 0) {
      return interaction.reply({ content: "No roles configured.", ephemeral: true });
    }

    let collectionMessage = collectionRoles.reduce((content, { roleId, collectionId, tokenCount }, index) => {
      return content + `${index + 1}. ${collectionId} (x${tokenCount}) has role ${interaction.guild?.roles.cache.get(roleId)}\n`;
    }, "");

    if (collectionRoles.length > 0) {
      collectionMessage = "## Collections\n" + collectionMessage;
    }

    if (tokenRoles.length > 0) {
      collectionMessage += "\n## Tokens\n";
    }

    let message = tokenRoles.reduce((content, { roleId, tokenId, balance }, index) => {
      return content + `${index + 1}. ${tokenId} (x${balance}) has role ${interaction.guild?.roles.cache.get(roleId)}\n`;
    }, collectionMessage);

    if (server.onConnectRoleId) {
      message += `\n## On Connect\n* ${interaction.guild?.roles.cache.get(server.onConnectRoleId)}`;
    }

    return interaction.reply({ content: message, ephemeral: true });
  }
};
