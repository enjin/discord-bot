import { Client, Events, GatewayIntentBits, GuildMemberRoleManager } from "discord.js";
import { commandCollection } from "./commands";
import config from "./config";
import { removeGuild, setupGuild } from "./util/server";
import buttonInteractions from "@/interactions/buttons";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildMessages]
});

client.on(Events.ClientReady, () => {
  console.log("Bot is ready!");
  client.user?.setActivity("Minting NFTs");
});

client.on(Events.Error, (error) => {
  console.error(error);
});

client.on(Events.ShardError, (error) => {
  console.error("A websocket connection encountered an error:", error);
});

client.on(Events.GuildCreate, async (guild) => {
  setupGuild(guild.id, guild.name);
  console.log(`Joined ${guild.name}`);
});

client.on(Events.GuildDelete, async (guild) => {
  removeGuild(guild.id);
  console.log(`removed ${guild.name}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commandCollection.get(interaction.commandName);

      if (command) {
        await command.handler(interaction);
      }
    }

    if (interaction.isButton()) {
      await buttonInteractions[interaction.customId as keyof typeof buttonInteractions](interaction);
    }
  } catch (error) {
    console.error(error, interaction.guildId);
    if (interaction.isRepliable()) {
      await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
  }
});

client.login(config.botToken);
