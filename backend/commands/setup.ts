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
import { getServerOrFail, setupGuild } from "../util/setup";
import { getToken } from "../util/api";

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup the bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) => option.setName("token").setDescription("Enter tokenId e.g. 2100-17").setRequired(true))
    .setDMPermission(false),

  async handler(interaction: ChatInputCommandInteraction) {
    setupGuild(interaction.guildId!, interaction.guild!.name);
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    }

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "You do not have permission to run this command.", ephemeral: true });
    }

    const tokenId = interaction.options.getString("token", true).trim();
    const token = await getToken(tokenId);
    if (!token) {
      return interaction.reply({ content: "Invalid token id", ephemeral: true });
    }

    const roleBuilder = new RoleSelectMenuBuilder().setCustomId("role").setPlaceholder("Select a role").setMinValues(1).setMaxValues(5);

    const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleBuilder);

    const response = await interaction.reply({ components: [row], content: `Please select a roles for ${tokenId} (${token.metadata.name})`, ephemeral: true });

    const server = await getServerOrFail(interaction.guildId!);

    const config: Record<string, string[]> = Object.assign({}, server.config);

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.RoleSelect, time: 30_000 });

    collector.on("collect", async (i) => {
      const selection = i.values;
      config[tokenId] = selection;
      await db.update(schema.servers).set({ config: config }).where(eq(schema.servers.id, i.guildId!)).execute();
      await i.reply({ content: `Roles ${i.roles.map(m=>m).join(', ')} added to token ${tokenId}`, ephemeral: true });
    });
  }
};
