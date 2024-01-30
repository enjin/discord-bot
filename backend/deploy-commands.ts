import { REST, Routes } from "discord.js";
import config from "./config";
import { commands } from "./commands";

const rest = new REST().setToken(config.botToken);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    console.log(commands, config);
    
    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
    }

    console.log(`Successfully registered application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
