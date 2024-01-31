import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
} from "discord.js";
import { getServerOrFail, setupGuild } from "../util/setup";


export default {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("List of configured tokens")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async handler(interaction: ChatInputCommandInteraction) {
    setupGuild(interaction.guildId!, interaction.guild!.name);

    if (!interaction.inGuild()) {
      return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    }

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "You do not have permission to run this command.", ephemeral: true });
    }

    const server = await getServerOrFail(interaction.guildId!);

    if(!server.config || Object.keys(server.config).length === 0){
      return interaction.reply({ content: "No roles configured.", ephemeral: true });
    }

    const message = Object.entries(server.config).reduce((content, [key, roles], index) => {
        return content + `${index + 1}. ${key} has roles ${roles.map(r=>interaction.guild?.roles.cache.get(r)).join(', ')}\n`;
    }, "");

    interaction.reply({ content: message, ephemeral: true });
  }
};
