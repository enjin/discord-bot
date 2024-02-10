import { GuildMemberRoleManager, type ButtonInteraction, Role } from "discord.js";
import { connectToWC, getClient } from "./wc";
import config from "../config";
import { tokenAccountsOfTokens } from "./api";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { pipe, map, uniqBy, filter, flatten } from "remeda";

export const handleConnectButton = async (interaction: ButtonInteraction) => {
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

      const tokenRoles = await db
        .select({
          role: schema.serverTokenRoles.roleId,
          token: schema.serverTokenRoles.tokenId
        })
        .from(schema.serverTokenRoles)
        .where(eq(schema.serverTokenRoles.serverId, interaction.guild!.id));

      if (tokenRoles.length === 0) {
        return interaction.followUp({ content: "❌ No roles configured on this server.", ephemeral: true });
      }

      const tokens = pipe(
        tokenRoles,
        uniqBy((r) => r.token),
        map((r) => r.token)
      );

      const result = await tokenAccountsOfTokens(tokens, addresses);

      const totalRoles = pipe(
        result,
        filter((r: any) => parseInt(r.totalBalance, 10) > 0),
        map((r: any) =>
          pipe(
            tokenRoles,
            filter((role) => role.token === r.token.id),
            map((role) => role.role),
            map((r) => interaction.guild!.roles.cache.get(r) as Role)
          )
        ),
        flatten()
      );

      try {
        if (totalRoles.length === 0) {
          return interaction.followUp({ content: "No roles to assign.", ephemeral: true });
        }



        if (interaction.member && interaction.member.roles instanceof GuildMemberRoleManager) {
          // refresh cache
          await interaction.guild!.members.fetch({ user: interaction.user });

          await interaction.member.roles.add(totalRoles);

          await interaction.channel?.send({
            content: `${interaction.member} has been given ${totalRoles.join(", ")}`
          });
        }
      } catch (error) {
        console.error(error);
        await interaction.followUp({ content: `❌ Can not assign roles. :${error}`, ephemeral: true });
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
};
