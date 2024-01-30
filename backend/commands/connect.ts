import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { connectToWC } from "../util/wc";
import config from "../config";

export default {
  data: new SlashCommandBuilder().setName("connect").setDescription("Connect to Enjin Wallet").setDMPermission(false),

  async handler(interaction: ChatInputCommandInteraction) {
    const { attachment, approval } = await connectToWC();

    const reply = await interaction.reply({
      content: "Please scan the QR code with Enjin Wallet to connect your wallet to the bot.",
      ephemeral: true,
      files: [attachment]
    });

    try {
      const session = await approval();

      if (session.acknowledged && session.namespaces.polkadot.accounts.length > 0) {
        const address = session.namespaces.polkadot.accounts[0].slice(config.wcNamespace.length + 1);
        await interaction.member?.roles.add("882443221750880522");
        await interaction.member?.setNickname(address);
      }

      await interaction.followUp({ content: "✅ Successfully connected to the bot.", ephemeral: true });
    } catch (error) {
      await interaction.followUp({ content: "Can not connect, please try again.", ephemeral: true });
    } finally {
      reply.delete();
    }
  }
};
