import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  RESTJSONErrorCodes,
  type RESTError
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
      where: eq(schema.servers.id, interaction.guildId)
    });

    if (!server) {
      return interaction.reply({ content: "Please setup your server with /setup command", ephemeral: true });
    }

    const embed = {
      title: "Connect to Enjin Wallet",
      description: description ?? undefined,
      color: 0xffffff,
      image: {
        url: "https://cdn.enjin.io/wallet-connect.gif"
      }
    };

    const buttonId: keyof typeof buttonInteractions = "connectWallet";

    const embedBuilder = new EmbedBuilder(embed);

    const connect = new ButtonBuilder().setCustomId(buttonId).setLabel("Click Here").setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(connect);

    try {
      await interaction.channel.send({ embeds: [embedBuilder], components: [row] });
      await interaction.reply({ content: "Button added", ephemeral: true });
    } catch (error) {
      if ((error as RESTError).code === RESTJSONErrorCodes.MissingAccess) {
        return interaction.reply({
          content: `Hey ${interaction.member.user.username}, This channel is set to private, and I'm unable to send messages here without the necessary permissions. \nCould you please add my role to the channel permissions and then try again?`,
          ephemeral: true
        });
      } else {
        return interaction.reply({ content: "Can not add button", ephemeral: true });
      }
    }

    setTimeout(() => {
      interaction.deleteReply();
    }, 2000);
  }
};
