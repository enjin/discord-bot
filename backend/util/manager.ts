import { EmbedBuilder, type Client, type Guild, type EmbedData } from "discord.js";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { filter, map, pipe, flatten, difference, concat, uniq, intersection } from "remeda";
import { collectionAccountsOfCollections, tokenAccountsOfTokens } from "@/util/api";

export default async function manageUserRoles(client: Client, serverId: string, memberId: string) {
  try {
    let guild: Guild | null | undefined = null;
    guild = client.guilds.cache.get(serverId);

    if (!guild) {
      try {
        guild = await client.guilds.fetch(serverId);
      } catch (error: any) {
        if (error.code === 10004) {
          // guild does not exist, that means the bot has been removed from the server
          throw new Error(`Guild was removed from the server: ${serverId}`);
        }

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

    const tokenRoles = await db.query.tokenRoles.findMany({
      columns: {
        tokenId: true,
        balance: true
      },
      with: {
        roles: {
          columns: {
            roleId: true
          }
        }
      },
      where: (tokenRoles, { eq }) => eq(tokenRoles.serverId, serverId)
    });

    const collectionRoles = await db.query.collectionRoles.findMany({
      columns: {
        collectionId: true,
        tokenCount: true
      },
      with: {
        roles: {
          columns: {
            roleId: true
          }
        }
      },
      where: (collectionRoles, { eq }) => eq(collectionRoles.serverId, serverId)
    });

    const tokens = pipe(
      tokenRoles,
      map((r) => r.tokenId)
    );

    const collections = pipe(
      collectionRoles,
      map((r) => r.collectionId)
    );

    const uniqueRolesAcrossServer = map(
      await db.query.roles
        .findMany({
          columns: {
            roleId: true
          },
          where: eq(schema.roles.serverId, serverId)
        })
        .execute(),
      (r) => r.roleId
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
      const filteredResult = filter(
        result,
        (r: any) =>
          parseInt(r.totalBalance, 10) > 0 && tokenRoles.some((role) => role.tokenId === r.token.id && parseInt(r.totalBalance, 10) >= role.balance)
      );

      totalRoles = totalRoles.concat(
        pipe(
          filteredResult,
          map((r: any) =>
            pipe(
              tokenRoles,
              filter((role) => role.tokenId === r.token.id && parseInt(r.totalBalance, 10) >= role.balance),
              map((role) => role.roles),
              flatten(),
              map((r) => r.roleId)
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
      const filteredResult = filter(
        result,
        (r: any) =>
          parseInt(r.accountCount, 10) > 0 &&
          collectionRoles.some((role) => role.collectionId === r.collection.id && parseInt(r.accountCount, 10) >= role.tokenCount)
      );

      totalRoles = totalRoles.concat(
        pipe(
          filteredResult,
          map((r: any) =>
            pipe(
              collectionRoles,
              filter((role) => role.collectionId === r.collection.id && parseInt(r.accountCount, 10) >= role.tokenCount),
              map((role) => role.roles),
              flatten(),
              map((r) => r.roleId)
            )
          ),
          flatten()
        )
      );
    }

    totalRoles = uniq(totalRoles);
    const alreadyAssigned = intersection(
      uniqueRolesAcrossServer,
      member.roles.cache.map((r) => r.id)
    );
    const rolesToAdd = difference(totalRoles, alreadyAssigned);
    const rolesToRemove = difference(alreadyAssigned, totalRoles);

    if (rolesToAdd.length === 0 && rolesToRemove.length === 0) {
      return;
    }

    const updatedRoles = pipe(
      member.roles.cache.map((r) => r.id),
      difference(uniqueRolesAcrossServer),
      concat(totalRoles)
    );

    await member.roles.set(updatedRoles);

    const embed: EmbedData = {
      title: `Your roles have been updated in ${guild.name}`,
      color: 0x7567ce,
      fields: [
        {
          name: "The following roles have been removed:",
          value: rolesToRemove.length !== 0 ? `- ${rolesToRemove.map((r) => guild!.roles.cache.get(r)!.name).join("\n- ")}` : "None",
          inline: false
        },
        {
          name: "The following roles have been added:",
          value: rolesToAdd.length !== 0 ? `- ${rolesToAdd.map((r) => guild!.roles.cache.get(r)!.name).join("\n- ")}` : "None",
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
