import type { User } from "discord.js";
import { connectToWC } from "../util/wc";

export default async function connect(user: User, guildId: string) {
  const { attachment, approval } = await connectToWC();

  await user.send({ content: "Please scan the QR code below to connect your wallet to the bot.", files: [attachment] });

  try {
    await approval();
    await user.send({ content: "Successfully connected to the bot." });
  } catch (error) {
    user.send({ content: "Can not connect, please try again." });
  }
 

}
