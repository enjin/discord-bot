import { Client, Events, GatewayIntentBits } from "discord.js";
import { commandCollection } from "./commands";
import config from "./config";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.on(Events.ClientReady, () => {
  console.log("Bot is ready!");

  client.user?.setActivity('Minting NFTs');
});

client.on(Events.Error, (error) => {
  console.error(error);
});

client.on(Events.ShardError, error => {
	console.error('A websocket connection encountered an error:', error);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commandCollection.get(interaction.commandName);
      if (command) {
        await command.handler(interaction);
      }
    }
  } catch (error) {
    console.error(error, interaction.guildId);
    if (interaction.isRepliable()) {
      await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
  }
});

client.login(config.botToken);
