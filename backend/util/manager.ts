import { EmbedBuilder, type Client, type Guild, PermissionFlagsBits, type Role, type EmbedData, Collection, type APIEmbedField } from "discord.js";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { filter, map, pipe, uniqBy, flatten, reduce, difference, concat, uniq, intersection } from "remeda";
import { collectionAccountsOfCollections, tokenAccountsOfTokens } from "@/util/api";

export default async function manageUserRoles(client: Client, serverId: string, memberId: string) {
  try {
    let guild: Guild | null | undefined = null;
    guild = client.guilds.cache.get(serverId);

    if (!guild) {
      guild = await client.guilds.fetch(serverId);

      // If the guild is still not found, throw an error
      if (!guild) {
        throw new Error("Guild not found");
      }
    }

    const member = await guild.members.fetch({
      user: memberId,
      force: true
    });

    // If the member is still not found, throw an error
    if (!member) {
      throw new Error("Member not found");

      //TODO: remove the connected account from the database
    }

    const tokenRoles = await db
      .select({
        role: schema.serverTokenRoles.roleId,
        token: schema.serverTokenRoles.tokenId
      })
      .from(schema.serverTokenRoles)
      .where(eq(schema.serverTokenRoles.serverId, serverId));

    const collectionRoles = await db
      .select({
        role: schema.serverCollectionRoles.roleId,
        collection: schema.serverCollectionRoles.collectionId
      })
      .from(schema.serverCollectionRoles)
      .where(eq(schema.serverCollectionRoles.serverId, serverId));

    const uniqueRolesAcrossServer = pipe(
      concat(tokenRoles, collectionRoles),
      uniqBy((r) => r.role),
      map((r) => r.role)
    );

    const tokens = pipe(
      tokenRoles,
      uniqBy((r) => r.token),
      map((r) => r.token)
    );

    const collections = pipe(
      collectionRoles,
      uniqBy((r) => r.collection),
      map((r) => r.collection)
    );

    const addresses = await db
      .selectDistinct({
        address: schema.accountAddress.address
      })
      .from(schema.accountAddress)
      .where(eq(schema.accountAddress.memberId, `${serverId}-${memberId}`));

    let totalRoles: string[] = [];

    if (tokenRoles.length !== 0) {
      const result = await tokenAccountsOfTokens(
        tokens,
        addresses.map((a) => a.address)
      );
      const filteredResult = filter(result, (r: any) => parseInt(r.totalBalance, 10) > 0);

      totalRoles = totalRoles.concat(
        pipe(
          filteredResult,
          map((r: any) =>
            pipe(
              tokenRoles,
              filter((role) => role.token === r.token.id),
              map((r) => r.role)
            )
          ),
          flatten()
        )
      );
    }

    if (collectionRoles.length !== 0) {
      const result = await collectionAccountsOfCollections(
        collections,
        addresses.map((a) => a.address)
      );
      const filteredResult = filter(result, (r: any) => parseInt(r.accountCount, 10) > 0);

      totalRoles = totalRoles.concat(
        pipe(
          filteredResult,
          map((r: any) =>
            pipe(
              collectionRoles,
              filter((role) => role.collection === r.collection.id),
              map((r) => r.role)
            )
          ),
          flatten()
        )
      );
    }

    totalRoles = uniq(totalRoles);
    const alreadyAssigned = intersection(uniqueRolesAcrossServer, member.roles.cache.map((r) => r.id));
    const rolesToAdd = difference(totalRoles, alreadyAssigned);
    const rolesToRemove = difference(alreadyAssigned, totalRoles);
   
    if (rolesToAdd.length === 0 && rolesToRemove.length === 0) {
      return;
    }

    const updatedRoles = pipe(
      member.roles.cache.map((r) => r.id),
      difference(uniqueRolesAcrossServer),
      concat(tokenRoles.map((r) => r.role)),
    );

    await member.roles.set(updatedRoles);

    const embed: EmbedData = {
      title: `Your roles have been updated in ${guild.name}`,
      color: 0x7567ce,
      fields: [
        {
          name: "The following roles have been removed:",
          value: rolesToRemove.length !== 0 ? rolesToRemove.map((r) => guild!.roles.cache.get(r)!.name).join(", ") : "None",
          inline: false
        },
        {
          name: "The following roles have been added:",
          value: rolesToAdd.length !== 0 ? rolesToAdd.map((r) => guild!.roles.cache.get(r)!.name).join(", ") : "None",
          inline: false
        }
      ]
    };
    const embedBuilder = new EmbedBuilder(embed);

    await client.users.send(memberId, {
      embeds: [embedBuilder]
    });
  } catch (error) {
    console.error("Error in manageUserRoles", error);
  }
}
