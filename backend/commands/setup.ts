import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import Zod from "zod";

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup the bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addStringOption((option) => option.setName("email").setDescription("Provide your email for receiving status updates.").setRequired(true)),

  async handler(interaction: ChatInputCommandInteraction) {
    const email = interaction.options.getString("email");
    const validated = Zod.string().email().safeParse(email);
    if (!validated.success) {
      await interaction.reply({ content: "Invalid email address.",  ephemeral: true });
      return;
    }
    

    await interaction.reply({ content: "Secret Pong!", ephemeral: true });
  }
};
