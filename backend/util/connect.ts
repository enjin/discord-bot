import { GuildMemberRoleManager, type ButtonInteraction, Role } from "discord.js";
import { connectToWC, getClient } from "./wc";
import config from "../config";
import { tokenAccountsOfTokens } from "./api";
import { db, schema } from "../db";
import { eq, sql } from "drizzle-orm";
import { pipe, map, uniqBy, filter, flatten, mapToObj, uniq } from "remeda";

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

      // add user to connected accounts
      await db
        .insert(schema.connectedAccounts)
        .values({
          id: `${interaction.guild!.id}-${interaction.member!.user.id}`,
          userId: interaction.member!.user.id,
          serverId: interaction.guild!.id
        })
        .onDuplicateKeyUpdate({ set: { id: sql`id` } });

      const tokens = pipe(
        tokenRoles,
        uniqBy((r) => r.token),
        map((r) => r.token)
      );

      const uniqueRolesAcrossTokens = pipe(
        tokenRoles,
        uniqBy((r) => r.role),
        map((r) => r.role)
      );

      const result = await tokenAccountsOfTokens(tokens, addresses);
      const filteredResult = filter(result, (r: any) => parseInt(r.totalBalance, 10) > 0);

      const accounts = pipe(
        filteredResult,
        map((r: any) => r.account.address as string),
        uniq()
      );

      const totalRoles = pipe(
        filteredResult,
        map((r: any) =>
          pipe(
            tokenRoles,
            filter((role) => role.token === r.token.id),
            map((r) => interaction.guild!.roles.cache.get(r.role) as Role)
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
          await interaction.member.roles.remove(uniqueRolesAcrossTokens);
          await interaction.member.roles.add(totalRoles);

          console.log(accounts);

          // save addresses to db
          await db.insert(schema.accountAddress).values(
            map(accounts, (a) => ({
              memberId: `${interaction.guild!.id}-${interaction.member!.user.id}`,
              address: a
            }))
          );

          await interaction.client.users.send(interaction.member.user.id, {
            content: `You have been given ${totalRoles.join(", ")} roles in ${interaction.guild!.name}.`
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
