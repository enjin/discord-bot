import { EmbedBuilder, type Client, type Guild, type GuildMemberRoleManager, type Role, type EmbedData, Collection } from "discord.js";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { filter, map, pipe, uniqBy, flatten, reduce } from "remeda";
import { tokenAccountsOfTokens } from "@/util/api";

export default async function manageUserRoles(client: Client, serverId: string, memberId: string) {
  let guild: Guild | null | undefined = null;
  guild = client.guilds.cache.get(serverId);

  if (!guild) {
    guild = await client.guilds.fetch(serverId);

    // If the guild is still not found, throw an error
    if (!guild) {
      throw new Error("Guild not found");
    }
  }

  const member = guild.members.cache.find((member) => member.user.id === memberId);
  if (!member) {
    throw new Error("Member not found");
  }

  const serverRoles = await db.select().from(schema.serverTokenRoles).where(eq(schema.serverTokenRoles.serverId, serverId));
  const uniqueRolesAcrossTokens = pipe(
    serverRoles,
    uniqBy((r) => r.roleId),
    map((r) => r.roleId)
  );

  const tokens = pipe(
    serverRoles,
    uniqBy((r) => r.tokenId),
    map((r) => r.tokenId)
  );

  const addresses = await db
    .selectDistinct({
      address: schema.accountAddress.address
    })
    .from(schema.accountAddress)
    .where(eq(schema.accountAddress.memberId, `${serverId}-${memberId}`));

  const result = await tokenAccountsOfTokens(
    tokens,
    addresses.map((a) => a.address)
  );
  const accountsWithBalance = filter(result, (r: any) => parseInt(r.totalBalance, 10) > 0);

  const toBeAssigned = pipe(
    accountsWithBalance,
    map((r: any) =>
      pipe(
        serverRoles,
        filter((role) => role.tokenId === r.token.id),
        map((r) => guild!.roles.cache.get(r.roleId) as Role)
      )
    ),
    flatten(),
    reduce((collection, role) => collection.set(role.id, role), new Collection<string, Role>())
  );

  const alreadyAssigned = member.roles.cache.filter((role) => uniqueRolesAcrossTokens.includes(role.id));

  const rolesToRemove = alreadyAssigned.filter((role) => !toBeAssigned.has(role.id));
  const rolesToAdd = toBeAssigned.filter((role) => !alreadyAssigned.has(role.id));

  console.log("Roles to remove", rolesToRemove);
  console.log("Roles to add", rolesToAdd);

  const roleManager = member.roles;
  await roleManager.remove(rolesToRemove);
  await roleManager.add(rolesToAdd);

  const embed: EmbedData = {
    title: `Your roles have been updated in ${guild.name}`,
    color: 0xffffff,
    timestamp: new Date(),
    fields: [
      {
        name: "The following roles have been removed:",
        value: rolesToRemove.size !== 0 ? rolesToRemove.map((r) => `<@&${r}>`).join(", ") : "None"
      },
      {
        name: "The following roles have been added:",
        value: rolesToAdd.size !== 0 ? rolesToAdd.map((r) => `<@&${r}>`).join(", ") : "None"
      }
    ]
  };
  const embedBuilder = new EmbedBuilder(embed);

  await client.users.send(memberId, {
    embeds: [embedBuilder]
  });
}
