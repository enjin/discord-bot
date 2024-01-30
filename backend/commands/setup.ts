import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import Zod from "zod";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup the bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async handler(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    // check if admin
    const isAdmin = interaction.memberPermissions.has(PermissionFlagsBits.Administrator);

    if (!isAdmin) {
      await interaction.reply({ content: "You do not have permission to run this command.", ephemeral: true });
      return;
    }

    const server = await db.query.servers.findFirst({
      where: eq(schema.servers.id, interaction.guildId)
    });

    if (!server) {
      await db.insert(schema.servers).values({ id: interaction.guildId, name: interaction.guild?.name });
    }

    await interaction.reply({ content: "Your config has been successfully saved", ephemeral: true });
  }
};
