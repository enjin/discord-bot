import { SlashCommandBuilder, ChatInputCommandInteraction, Role, GuildMemberRoleManager } from "discord.js";
import { connectToWC, getClient } from "../util/wc";
import config from "../config";
import { getServerOrFail } from "../util/setup";
import { tokenAccountsOfTokens } from "../util/api";

export default {
  data: new SlashCommandBuilder().setName("connect").setDescription("Connect to Enjin Wallet").setDMPermission(false),

  async handler(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    }

    const { attachment, approval } = await connectToWC();

    const reply = await interaction.reply({
      content: "Please scan the QR code with Enjin Wallet to connect your wallet to the bot.",
      ephemeral: true,
      files: [attachment]
    });

    try {
      const session = await approval();

      if (session.namespaces.polkadot.accounts.length > 0) {
        const addresses = session.namespaces.polkadot.accounts.map((n) => n.slice(config.wcNamespace.length + 1));
        interaction.followUp({ content: "✅ Successfully connected to the bot.", ephemeral: true });

        const server = await getServerOrFail(interaction.guildId!);
        if (!server.config) {
          return interaction.followUp({ content: "❌ No roles configured.", ephemeral: true });
        }

        const tokens = Object.keys(server.config);

        const result = await tokenAccountsOfTokens(tokens, addresses);

        const totalRoles = result
          .filter((r: any) => parseInt(r.totalBalance, 10) > 0)
          .map((r: any) => {
            const token = r.token.id;
            const roles = server.config![token];

            return roles.map((r) => interaction.guild!.roles.cache.get(r) as Role);
          })
          .flat();

        await interaction.followUp({
          content: `${interaction.member} assigned with ${totalRoles.join(", ")}`,
          ephemeral: false,
        });

        if (interaction.member.roles instanceof GuildMemberRoleManager) {
          await interaction.member.roles.add(totalRoles);
        }
      } else {
        await interaction.followUp({ content: "❌ No accounts found.", ephemeral: true });
      }

      getClient()
        .then((client) => client?.disconnect({ topic: session!.topic, reason: { message: "User disconnected.", code: 6e3 } }))
        .catch(console.error);
    } catch (error) {
      console.error(error);
      await interaction.followUp({ content: "Can not connect, please try again.", ephemeral: true });
    } finally {
      reply.delete();
    }
  }
};
