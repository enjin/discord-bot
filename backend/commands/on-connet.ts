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

    const roleBuilder = new RoleSelectMenuBuilder().setCustomId("role").setPlaceholder("Select a role").setMinValues(1).setMaxValues(1);
    const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleBuilder);

    // Collection
    const server = await getServerOrFail(interaction.guildId);

    const response = await interaction.reply({
      components: [row],
      content: `Please select a role`,
      ephemeral: true
    });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.RoleSelect, time: 30_000 });

    collector.on("collect", async (i) => {
      if (i.roles.some((r) => r.managed)) {
        i.reply({ content: "You cannot select managed roles", ephemeral: true });
        interaction.deleteReply();
        return;
      }

      await db
        .update(schema.servers)
        .set({
          onConnectRoleId: i.roles.first()?.id
        })
        .where(eq(schema.servers.id, interaction.guildId))
        .execute();

      await i.reply({
        content: `The role has been set, users will now receive this role when they connect their wallet.`,
        ephemeral: true
      });

      return interaction.deleteReply();
    });
  }
};
