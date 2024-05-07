# Enjin Discord Bot

## Overview

The Enjin Discord bot, powered by Discord.js and Bun runtime, enables role assignment based on tokens stored in users' Enjin wallets. Its main function is to assign discord roles to members who possess the designated token set by the server administrator.

## Getting Started

### Invite the Bot

To add the Enjin Discord bot to your guild (server), click on the following link: [Invite Enjin Bot](https://enj.in/discord-bot)

### Setting Up Rules 

1. **Invite the Bot:** Use the provided link to invite the Enjin bot to your guild.

2. **Permissions:** Ensure that the bot has the highest role in the server, if not goto server settings > roles and drag the bot role to the top.

3. **Run Setup Command:** In your Discord server, use the slash command `/setup` to initiate the setup process.

4. **Add Conditions:** Follow the prompts to add rule for a asset, repeat again to add rule for more assets. 


### Viewing Rules

To check all existing rules, use the slash command `/list`. This will provide a list of tokens and it's role assignments.

### Connect Enjin Wallet

1. **Add Connect Button:** Run `/add-button` to add a connect button to the channel, this will allow users to connect their wallet.

2. **Connect Walllet:** User can click on the "Connect To Wallet" button to connect their wallet to the server.

### Self-Hosting

To self-host this bot, follow the steps below:

1. **Requirements:**
   - Docker: Install Docker on your machine. You can find installation instructions at [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/).
   - MySQL: Install MySQL >=8 on your machine. You can find installation instructions at [https://dev.mysql.com/doc/mysql-installation-excerpt/8.0/en/](https://dev.mysql.com/doc/mysql-installation-excerpt/8.0/en/).
   - Wallet Connect API Key: Obtain a Wallet Connect API key from [https://cloud.walletconnect.com/](https://cloud.walletconnect.com/).
   - Discord Developer API Key: Obtain a Discord Developer API key by creating a new application at [https://discord.com/developers/applications](https://discord.com/developers/applications).
   - Discord Bot Token: Obtain a Discord bot token by creating a new bot in your Discord Developer application.

2. **Setup Discord Bot**
   - Create a new Discord bot by following the instructions at [https://discord.com/developers/applications](https://discord.com/developers/applications).
   - Copy the Bot APPLICATION ID (in general information tab) and save it for later use.
   - Go to the Bot tab and,
     - Add Icon
     - Add Username
     - Click on "Reset Token" to get the bot token.
     - Copy the Bot Token. And save it for later use.
     - Enable the "Public Bot" option.

3. **Create Docker Image:**

   #### Create Docker Image
   - Clone the Enjin Discord Bot repository from [https://github.com/enjin/discord-bot/](https://github.com/enjin/discord-bot/).
   - Navigate to the cloned repository directory.
   - Build the Docker image using the following command:
     ```
     docker build -t enjin/discord-bot .
     ```

   #### Pull Docker Image
   - Alternatively, you can pull the Docker image from the Enjin Docker Hub using the following command:
     ```
     docker pull enjin/discord-bot:latest
     ```
   

4. **Set Environment Variables:**
   - Create a `.env` file in the cloned repository directory.
   - Add the following environment variables to the `.env` file:
     ```
     DISCORD_BOT_TOKEN=
     WALLET_CONNECT_PROJECT_ID=
     DISCORD_APPLICATION_ID=
     DB_URL=mysql://user:password@127.0.0.1:3306/db_name
     RPC_URL=wss://rpc.matrix.blockchain.enjin.io
     ```

5. **Run the Bot:**
   - Start the bot using the following command:
     ```
     docker run --env-file .env enjin/discord-bot
     ```

6. **Run without Docker:**
    - If you prefer to run the bot without Docker, you can do so by running the following command:
      ```
      bun install
      bun dev
      ```
      Ensure that you have [Bun](https://bun.sh/) installed on your machine.

   The bot should now be running and ready to use in your self-hosted environment

7. **Invite the Bot:**
   - Construct the invite URL using the following format:
     ```
     https://discord.com/oauth2/authorize?client_id=YOUR_DISCORD_APPLICATION_ID&scope=bot&permissions=275146345536
     ```

## Support and Feedback

For any issues, questions, or feedback, please contact Enjin Support at [support@enjin.io](mailto:support@enjin.io).

