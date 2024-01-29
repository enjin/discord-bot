require("dotenv").config();

const {
  Client,
  Events,
  GatewayIntentBits,
  AttachmentBuilder,
} = require("discord.js");

const qr = require("qrcode");
const Canvas = require("@napi-rs/canvas");
const { connectUser } = require("./connect");
const { isAdmin } = require("./utils");

const prefix = "!";

const configs = new Map();

const setup = () => {
  if (!isAdmin(message.member)) {
    message.reply("You do not have permission to use this command");

    return;
  }

  if (args.length !== 2) {
    message.reply("Please use !setup <collection_id> <rank_id>");

    return;
  }

  if (configs.has(message.guild.id)) {
    message.reply(
      "Bot already setup. if you want to change the setup, please use !reset"
    );

    return;
  }

  const collectionId = args[0];
  const roleId = args[1];

  configs.set(message.guild.id, { collectionId, roleId });
  message.reply("Setup complete!");
};

const reset = (message) => {
  if (!isAdmin(message.member)) {
    message.reply("You do not have permission to use this command");

    return;
  }

  if (!configs.has(message.guild.id)) {
    message.reply(
      "Bot not setup yet. Please use !setup <collection_id> <rank_id>"
    );

    return;
  }

  configs.delete(message.guild.id);
  message.reply("Reset complete!");
};

const buy = (message) => {
  if (!configs.has(message.guild.id)) {
    message.reply("Please setup the bot first");

    return;
  }

  message.reply(
    "https://nft.io/collection/" + configs.get(message.guild.id).collectionId
  );
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) {
    return;
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "setup") {
    setup(message);

    return;
  }

  if (command === "reset") {
    reset(message);

    return;
  }

  if (command === "enjin") {
    message.reply("https://enjin.io");

    return;
  }

  if (command === "buy") {
    buy(message);

    return;
  }

  if (command === "connect") {
    if (!configs.has(message.guild.id)) {
      message.reply("Please setup the bot first");

      return;
    }

    const user = message.author;
    await connectUser(user, message.guild, configs.get(message.guild.id));

    return;
  }
});

client.login(process.env.BOT_TOKEN);
