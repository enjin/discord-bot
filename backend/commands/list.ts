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
      where: eq(schema.servers.id, interaction.guildId!)
    });

    if (!server) {
      return interaction.reply({ content: "Please setup your server with /setup command", ephemeral: true });
    }

    const roles = await db.select().from(schema.serverTokenRoles).where(eq(schema.serverTokenRoles.serverId, interaction.guildId!)).execute();

    if (roles.length === 0) {
      return interaction.reply({ content: "No roles configured.", ephemeral: true });
    }

    const message = roles.reduce((content, { roleId, tokenId }, index) => {
      return content + `${index + 1}. ${tokenId} has roles ${roles.map((r) => interaction.guild?.roles.cache.get(roleId)).join(", ")}\n`;
    }, "");

    return interaction.reply({ content: message, ephemeral: true });
  }
};
