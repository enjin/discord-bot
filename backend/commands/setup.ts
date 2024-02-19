import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  ComponentType
} from "discord.js";
import { db, schema } from "../db";
import { and, eq } from "drizzle-orm";
import { setupGuild } from "../util/server";
import { getToken } from "../util/api";
import { map } from "remeda";

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup the bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) => option.setName("asset").setDescription("Enter Asset ID e.g. 2100-17").setRequired(true))
    .setDMPermission(false),

  async handler(interaction: ChatInputCommandInteraction) {
    setupGuild(interaction.guildId!, interaction.guild!.name);
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    }

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "You do not have permission to run this command.", ephemeral: true });
    }

    const tokenId = interaction.options.getString("asset", true).trim();
    const token = await getToken(tokenId);
    if (!token) {
      return interaction.reply({ content: "Invalid asset id", ephemeral: true });
    }

    const roleBuilder = new RoleSelectMenuBuilder().setCustomId("role").setPlaceholder("Select a role").setMinValues(1).setMaxValues(5);

    const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleBuilder);

    const response = await interaction.reply({
      components: [row],
      content: `Please select a roles for ${tokenId} (${token.metadata.name})`,
      ephemeral: true
    });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.RoleSelect, time: 30_000 });

    collector.on("collect", async (i) => {
      await db
        .delete(schema.serverTokenRoles)
        .where(and(eq(schema.serverTokenRoles.serverId, interaction.guildId!), eq(schema.serverTokenRoles.tokenId, tokenId)))
        .execute();

      await db
        .insert(schema.serverTokenRoles)
        .values(map(i.values, (r) => ({ serverId: interaction.guildId!, tokenId, roleId: r })))
        .execute();

      await i.reply({ content: `Roles ${i.roles.map((m) => m).join(", ")} added to token ${tokenId}`, ephemeral: true });
    });
  }
};
