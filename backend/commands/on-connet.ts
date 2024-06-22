import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  ComponentType
} from "discord.js";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { getServerOrFail, setupGuild } from "../util/server";

export default {
  data: new SlashCommandBuilder()
    .setName("on-connect")
    .setDescription("Add roles to users when they connect their wallet")
    .addRoleOption((option) => option.setName("role").setDescription("The role to add to users when they connect their wallet").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async handler(interaction: ChatInputCommandInteraction) {
    setupGuild(interaction.guildId as string, interaction.guild?.name ?? "");
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    }

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "You do not have permission to run this command.", ephemeral: true });
    }

    const role = interaction.options.getRole("role", true);

    if (role.managed) {
      return interaction.reply({ content: "You cannot set a managed role.", ephemeral: true });
    }

    await db
      .update(schema.servers)
      .set({
        onConnectRoleId: role.id
      })
      .where(eq(schema.servers.id, interaction.guildId))
      .execute();

    await interaction.reply({
      content: `The role has been set, users will now receive this role when they connect their wallet.`,
      ephemeral: true
    });
  }
};
