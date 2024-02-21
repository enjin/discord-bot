import { GuildMemberRoleManager, type ButtonInteraction, Role } from "discord.js";
import { connectToWC, getClient } from "@/util/wc";
import config from "@/config";
import { tokenAccountsOfTokens } from "@/util/api";
import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { pipe, map, uniqBy, filter, flatten, uniq } from "remeda";

export const connectWallet = async (interaction: ButtonInteraction) => {
  const { attachment, approval, verifyAddress } = await connectToWC();

  await interaction.reply({
    content: "Scan this QR using your Enjin Blockchain Wallet",
    ephemeral: true,
    files: [attachment]
  });

  try {
    const session = await approval();

    if (session.namespaces.polkadot.accounts.length === 0) {
      return interaction.followUp({ content: "❌ No accounts found.", ephemeral: true });
    }

    const addresses = session.namespaces.polkadot.accounts.map((n) => n.slice(config.wcNamespace.length + 1));

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

    if (totalRoles.length === 0) {
      return interaction.followUp({ content: "No roles to assign.", ephemeral: true });
    }

    // === Start OF VERIFY ADDRESS ===
    await interaction.editReply({ files: [], content: "⏳ Please sign a message to verify your identity." });
    try {
      for (const account of accounts) {
        const isValid = await verifyAddress(account, session);
        if (!isValid) {
          throw new Error("Invalid signature.");
        }
      }
    } catch (error) {
      return interaction.followUp({ content: `❌ Can not verify address. ${error}`, ephemeral: true });
    }
    // === END OF VERIFY ADDRESS ===

    // disconnect client
    getClient()
      .then((client) => client?.disconnect({ topic: session!.topic, reason: { message: "User disconnected.", code: 6e3 } }))
      .catch(console.error);

    // === Start OF ASSIGN ROLES ===
    try {
      if (interaction.member && interaction.member.roles instanceof GuildMemberRoleManager) {
        // refresh cache
        await interaction.guild!.members.fetch({ user: interaction.user });

        // remove all roles
        await interaction.member.roles.remove(uniqueRolesAcrossTokens);

        // add roles
        await interaction.member.roles.add(totalRoles);

        // remove existing addresses from db
        await db.delete(schema.accountAddress).where(eq(schema.accountAddress.memberId, `${interaction.guild!.id}-${interaction.member!.user.id}`));

        // save new addresses to db
        await db.insert(schema.accountAddress).values(
          map(accounts, (a) => ({
            memberId: `${interaction.guild!.id}-${interaction.member!.user.id}`,
            address: a
          }))
        );

        await interaction.client.users.send(interaction.member.user.id, {
          content: `You have been given ${totalRoles.map((role) => role.name).join(", ")} roles in ${interaction.guild!.name}.`
        });
      }
    } catch (error) {
      console.error("assign role", error);
      await interaction.followUp({ content: `❌ Can not assign roles. :${error}`, ephemeral: true });
    }
    // === END OF ASSIGN ROLES ===
  } catch (error) {
    console.error(error);
    await interaction.followUp({ content: "Can not connect, please try again.", ephemeral: true });
  } finally {
    interaction.deleteReply();
  }
};
