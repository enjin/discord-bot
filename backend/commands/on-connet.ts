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
  
  export default {
    data: new SlashCommandBuilder()
      .setName("on-connect")
      .setDescription("Add roles to users when they connect their wallet")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .setDMPermission(false),
  
    async handler(interaction: ChatInputCommandInteraction) {
      setupGuild(interaction.guildId as string, interaction.guild?.name ?? "");
      if (!interaction.inGuild()) {
        return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      }
  
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: "You do not have permission to run this command.", ephemeral: true });
      }

  
      const roleBuilder = new RoleSelectMenuBuilder().setCustomId("role").setPlaceholder("Select a role").setMinValues(1).setMaxValues(1);
      const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleBuilder);
  
      
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
            .where(
              and(
                eq(schema.collectionRoles.serverId, interaction.guildId),
                eq(schema.collectionRoles.collectionId, collectionId),
                eq(schema.collectionRoles.tokenCount, balance)
              )
            )
            .execute();
  
          await db
            .insert(schema.collectionRoles)
            .values({ serverId: interaction.guildId, collectionId, tokenCount: balance, roleId: i.values.at(0) as string })
            .execute();
  
          await i.reply({
            content: `Role${i.roles.size === 0 ? "" : "s"} ${i.roles.map((m) => m).join(", ")} added for collection ${collectionId}`,
            ephemeral: true
          });
  
          return interaction.deleteReply();
        });
      
    }
  };
  