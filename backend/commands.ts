import { ChatInputCommandInteraction, Collection, InteractionResponse, SlashCommandBuilder, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import allCommands from "./commands/index";

type Command = {
  data: SlashCommandBuilder;
  handler(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | undefined>;
}

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
const commandCollection = new Collection<string, Command>();

for (const command of allCommands) {
  commands.push(command.data.toJSON());
  commandCollection.set(command.data.name, command);
}

export { commands, commandCollection };
