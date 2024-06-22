import {
  GuildMemberRoleManager,
  type ButtonInteraction,
  Role,
  type EmbedData,
  EmbedBuilder,
  type APIEmbedField,
  RESTJSONErrorCodes
} from "discord.js";
import { connectToWC, getClient } from "@/util/wc";
import config from "@/config";
import { collectionAccountsOfCollections, tokenAccountsOfTokens } from "@/util/api";
import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { getServerOrFail } from "@/util/server";
import { pipe, map, uniqBy, filter, flatten, uniq, difference, concat } from "remeda";

export const connectWallet = async (interaction: ButtonInteraction) => {
  const { attachment, approval, verifyAddress } = await connectToWC();

  await interaction.reply({
    content: "Scan this QR using your Enjin Blockchain Wallet",
    ephemeral: true,
    files: [attachment]
  });

  try {
    const session = await approval();

    const server = await getServerOrFail(interaction.guildId!);

    if (session.namespaces.polkadot.accounts.length === 0) {
      return interaction.followUp({ content: "❌ No accounts found.", ephemeral: true });
    }

    const addresses = session.namespaces.polkadot.accounts.map((n) => n.slice(config.wcNamespace.length + 1));

    const tokenRoles = await db.query.tokenRoles.findMany({
      where: (tokenRoles, { eq }) => eq(tokenRoles.serverId, interaction.guildId!)
    });

    const collectionRoles = await db.query.collectionRoles.findMany({
      where: (collectionRoles, { eq }) => eq(collectionRoles.serverId, interaction.guildId!)
    });

    if (tokenRoles.length === 0 && collectionRoles.length === 0 && !server.onConnectRoleId) {
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
      map((r) => r.tokenId)
    );

    const collections = pipe(
      collectionRoles,
      map((r) => r.collectionId)
    );

    const uniqueRolesAcrossServer = pipe(
      concat(tokenRoles, collectionRoles),
      uniqBy((r) => r.roleId),
      map((r) => r.roleId)
    );

    let totalRoles: Role[] = [];
    let accountsToVerify: string[] = [];
    const embedResultField: APIEmbedField[] = [];

    if (server.onConnectRoleId) {
      const role = interaction.guild!.roles.cache.get(server.onConnectRoleId);
      if (role) {
        totalRoles.push(role);
        embedResultField.push({
          name: "You have been granted for connecting your wallet:",
          value: `- ${role.name}`,
          inline: false
        });
      }
    }

    // handle token roles
    if (tokenRoles.length !== 0) {
      const result = await tokenAccountsOfTokens(tokens, addresses);
      const filteredResult = filter(
        result,
        (r) =>
          parseInt(r.totalBalance, 10) > 0 && tokenRoles.some((role) => role.tokenId === r.token.id && parseInt(r.totalBalance, 10) >= role.balance)
      );

      accountsToVerify = accountsToVerify.concat(
        pipe(
          filteredResult,
          map((r) => r.account.address as string)
        )
      );

      totalRoles = totalRoles.concat(
        pipe(
          filteredResult,
          map((r) =>
            pipe(
              tokenRoles,
              filter((role) => role.tokenId === r.token.id && parseInt(r.totalBalance, 10) >= role.balance),
              map((role) => role.roleId),
              map((r) => interaction.guild!.roles.cache.get(r) as Role)
            )
          ),
          flatten()
        )
      );

      embedResultField.push({
        name: "You own the following tokens:",
        value: `- ${uniqBy(filteredResult, (r) => r.token.id)
          .map((r) => r.token.metadata?.name ?? r.token.id)
          .join("\n- ")}`,
        inline: false
      });
    }

    // handle collection roles
    if (collectionRoles.length !== 0) {
      const result = await collectionAccountsOfCollections(collections, addresses);
      const filteredResult = filter(
        result,
        (r) =>
          parseInt(r.accountCount, 10) > 0 &&
          collectionRoles.some((role) => role.collectionId === r.collection.id && parseInt(r.accountCount, 10) >= role.tokenCount)
      );

      accountsToVerify = accountsToVerify.concat(
        pipe(
          filteredResult,
          map((r: any) => r.account.address as string)
        )
      );

      totalRoles = totalRoles.concat(
        pipe(
          filteredResult,
          map((r: any) =>
            pipe(
              collectionRoles,
              filter((role) => role.collectionId === r.collection.id && parseInt(r.accountCount, 10) >= role.tokenCount),
              map((role) => role.roleId),
              map((r) => interaction.guild!.roles.cache.get(r) as Role)
            )
          ),
          flatten()
        )
      );

      embedResultField.push({
        name: "You own a token from collections:",
        value: `- ${uniqBy(filteredResult, (r) => r.collection.id)
          .map((r: any) => r.collection.metadata?.name ?? r.collection.id)
          .join("\n- ")}`,
        inline: false
      });
    }

    if (totalRoles.length === 0) {
      const embed: EmbedData = {
        title: `Sorry, but there are currently no roles available for you. However, you can earn the Discord role by collecting the following NFTs:`,
        color: 0x7567ce,
        fields: [
          {
            name: "",
            value: `- ${tokenRoles
              .map(
                (role) =>
                  `Acquire ${role.balance} copies of Token [${role.tokenId}](https://nft.io/asset/${role.tokenId}) to get <@&${role.roleId}> role`
              )
              .join("\n- ")}`,
            inline: false
          },
          {
            name: "",
            value: `- ${collectionRoles
              .map(
                (role) =>
                  `Collect ${role.tokenCount} Tokens from Collection [${role.collectionId}](https://nft.io/collection/${role.collectionId}) to get <@&${role.roleId}> role`
              )
              .join("\n- ")}`,
            inline: false
          }
        ]
      };
      const embedBuilder = new EmbedBuilder(embed);
      return interaction.followUp({
        embeds: [embedBuilder],
        ephemeral: true
      });
    }

    accountsToVerify = uniq(accountsToVerify);

    // === Start OF VERIFY ADDRESS ===
    await interaction.editReply({ files: [], content: "⏳ Please sign a message to verify your identity." });
    try {
      for (const account of accountsToVerify) {
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
        await interaction.guild!.members.fetch({ user: interaction.user, force: true });

        const updatedRoles = pipe(
          interaction.member.roles.cache.map((r) => r.id),
          difference(uniqueRolesAcrossServer), // remove
          concat(uniqBy(totalRoles, (r) => r.id)) // add
        );

        // add roles
        await interaction.member.roles.set(updatedRoles);

        // remove existing addresses from db
        await db.delete(schema.accountAddress).where(eq(schema.accountAddress.memberId, `${interaction.guild!.id}-${interaction.member!.user.id}`));

        // save new addresses to db
        await db.insert(schema.accountAddress).values(
          map(accountsToVerify, (a) => ({
            memberId: `${interaction.guild!.id}-${interaction.member!.user.id}`,
            address: a
          }))
        );

        const embed: EmbedData = {
          title: `You have successfully linked your wallet to ${interaction.guild!.name}`,
          color: 0x7567ce,
          image: {
            url: "https://cdn.enjin.io/wallet-linked.gif"
          },
          fields: [
            ...embedResultField,
            {
              name: "And have been granted these roles:",
              value: `- ${uniqBy(totalRoles, (r) => r.id)
                .map((role) => role.name)
                .join("\n- ")}`,
              inline: false
            },
            {
              name: "",
              value: `Congratulations!`,
              inline: false
            }
          ]
        };
        const embedBuilder = new EmbedBuilder(embed);

        await interaction.followUp({ content: "✅ Wallet connected successfully.", embeds: [embedBuilder], ephemeral: true });
      }
    } catch (error: any) {
      if (error.code === RESTJSONErrorCodes.MissingPermissions) {
        await interaction.followUp({
          content: `❌ Roles cannot be assigned. The bot role must be higher in hierarchy compared to other roles.`,
          ephemeral: true
        });
      } else {
        await interaction.followUp({ content: `❌ Roles cannot be assigned. :${error}`, ephemeral: true });
      }
    }
    // === END OF ASSIGN ROLES ===
  } catch (error) {
    console.error(error);
    await interaction.followUp({ content: "Can not connect, please try again.", ephemeral: true });
  } finally {
    interaction.deleteReply();
  }
};
