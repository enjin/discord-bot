import { Collection } from "discord.js";
import allCommands from "./commands/index";

const commands: any[] = [];
const commandCollection = new Collection<string, (typeof allCommands)[0]>();

for (const command of allCommands) {
  commands.push(command.data.toJSON());
  commandCollection.set(command.data.name, command);
}

export { commands, commandCollection };
