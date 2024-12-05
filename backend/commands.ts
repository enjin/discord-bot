import {
  ChatInputCommandInteraction,
  Collection,
  InteractionResponse,
  type SlashCommandOptionsOnlyBuilder,
  type RESTPostAPIChatInputApplicationCommandsJSONBody
} from "discord.js";
import allCommands from "./commands/index";

type Command = {
  data: SlashCommandOptionsOnlyBuilder;
  handler(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | undefined>;
};

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
const commandCollection = new Collection<string, Command>();

for (const command of allCommands) {
  commands.push(command.data.toJSON());
  commandCollection.set(command.data.name, command);
}

export { commands, commandCollection };
