import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import buttonInteractions from "@/interactions/buttons";

export default {
  data: new SlashCommandBuilder()
    .setName("add-button")
    .setDescription("Add wallet connect button to the message")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) => option.setName("description").setDescription("Optional description to be displayed above the button"))
    .setDMPermission(false),

  async handler(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    }

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "You do not have permission to run this command.", ephemeral: true });
    }

    if (!interaction.channel) {
      return interaction.reply({ content: "This command can only be used in a channel.", ephemeral: true });
    }

    const description = interaction.options.getString("description", false);

    const server = await db.query.servers.findFirst({
      where: eq(schema.servers.id, interaction.guildId!)
    });

    if (!server) {
      return interaction.reply({ content: "Please setup your server with /setup command", ephemeral: true });
    }

    const embed = {
      title: "Connect to Enjin Wallet",
      description: description ?? undefined,
      color: 0xffffff,
      timestamp: new Date(),
      image: {
        url: "https://media0.giphy.com/media/W5C9c8nqoaDJWh34i6/giphy.gif"
      }
    };

    const buttonId: keyof typeof buttonInteractions = 'connectWallet'

    const embedBuilder = new EmbedBuilder(embed);

    const connect = new ButtonBuilder().setCustomId(buttonId).setLabel("Connect to Wallet").setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(connect);

    await interaction.channel.send({ embeds: [embedBuilder], components: [row] });

    return interaction.reply({ content: "Button added", ephemeral: true });
  }
};
