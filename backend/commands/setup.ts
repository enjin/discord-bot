import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  ComponentType
} from "discord.js";
import { db, schema } from "../db";
import { and, eq } from "drizzle-orm";
import { setupGuild } from "../util/server";
import { getCollection, getToken } from "../util/api";
import { map } from "remeda";


export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup the bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) => option.setName("collection").setDescription("Enter collection ID").setRequired(true))
    .addIntegerOption((option) => option.setName("balance").setDescription("Enter balance of the token or Enter account count of the collection"))
    .addStringOption((option) => option.setName("asset").setDescription("Enter Asset ID"))
    .setDMPermission(false),

  async handler(interaction: ChatInputCommandInteraction) {
    setupGuild(interaction.guildId as string, interaction.guild?.name ?? '');
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    }

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "You do not have permission to run this command.", ephemeral: true });
    }

    const collectionId = interaction.options.getString("collection", true).trim();
    const tokenId = interaction.options.getString("asset", false);
    const balance = interaction.options.getInteger("balance", false) || 1;

    if (balance > 10_000) {
      return interaction.reply({ content: "Balance should be less than 10,000", ephemeral: true });
    }

    const roleBuilder = new RoleSelectMenuBuilder().setCustomId("role").setPlaceholder("Select a role").setMinValues(1).setMaxValues(5);
    const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleBuilder);

    if (tokenId !== null) {
      const assetId = `${collectionId}-${tokenId.trim()}`;
      const token = await getToken(assetId);
      if (!token) {
        return interaction.reply({ content: "Invalid asset id", ephemeral: true });
      }

      const response = await interaction.reply({
        components: [row],
        content: `Please select role(s) for ${assetId}${token.metadata ? ` (${token.metadata.name})` : ""}`,
        ephemeral: true
      });

      const collector = response.createMessageComponentCollector({ componentType: ComponentType.RoleSelect, time: 30_000 });
      collector.on("collect", async (i) => {
        if (i.roles.some((r) => r.managed)) {
          i.reply({ content: "You cannot select managed roles", ephemeral: true });
          interaction.deleteReply();
          return;
        }
        await db
          .delete(schema.tokenRoles)
          .where(and(eq(schema.tokenRoles.serverId, interaction.guildId), eq(schema.tokenRoles.tokenId, assetId)))
          .execute();

        await db
          .insert(schema.tokenRoles)
          .values({ serverId: interaction.guildId, tokenId: assetId, balance })
          .execute();

        await db
          .insert(schema.roles)
          .values(map(i.values, (r) => ({ serverId: interaction.guildId, tokenId: assetId, roleId: r })))
          .execute();

        await i.reply({
          content: `Role${i.roles.size === 1 ? "" : "s"} ${i.roles.map((m) => m).join(", ")} added for token ${assetId}`,
          ephemeral: true
        });

        return interaction.deleteReply();
      });
    } else {
      // Collection
      const collection = await getCollection(collectionId);
      if (!collection) {
        return interaction.reply({ content: "Invalid collection id", ephemeral: true });
      }

      const response = await interaction.reply({
        components: [row],
        content: `Please select role(s) for ${collectionId}${collection.metadata ? ` (${collection.metadata.name})` : ""}`,
        ephemeral: true
      });

      const collector = response.createMessageComponentCollector({ componentType: ComponentType.RoleSelect, time: 30_000 });

      collector.on("collect", async (i) => {
        if (i.roles.some((r) => r.managed)) {
          i.reply({ content: "You cannot select managed roles", ephemeral: true });
          interaction.deleteReply();
          return;
        }

        await db
          .delete(schema.collectionRoles)
          .where(and(eq(schema.collectionRoles.serverId, interaction.guildId), eq(schema.collectionRoles.collectionId, collectionId)))
          .execute();

        await db.insert(schema.collectionRoles).values({ serverId: interaction.guildId, collectionId, tokenCount: balance }).execute();

        await db
          .insert(schema.roles)
          .values(map(i.values, (r) => ({ serverId: interaction.guildId, collectionId, roleId: r, tokenCount: balance })))
          .execute();

        await i.reply({
          content: `Role${i.roles.size === 0 ? "" : "s"} ${i.roles.map((m) => m).join(", ")} added for collection ${collectionId}`,
          ephemeral: true
        });

        return interaction.deleteReply();
      });
    }
  }
};
