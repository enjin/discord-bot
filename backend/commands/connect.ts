import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { connectToWC } from "../util/wc";

export default {
  data: new SlashCommandBuilder().setName("connect").setDescription("Connect to Enjin Wallet").setDMPermission(false),

  async handler(interaction: ChatInputCommandInteraction) {
    const { attachment, approval } = await connectToWC();

    const reply = await interaction.reply({
      content: "Please scan the QR code below to connect your wallet to the bot.",
      ephemeral: true,
      files: [attachment]
    });

    try {
      await approval();

      await interaction.followUp({ content: "✅ Successfully connected to the bot.", ephemeral: true });
    } catch (error) {
      await interaction.followUp({ content: "Can not connect, please try again.", ephemeral: true });
    } finally {
      reply.delete();
    }
  }
};
