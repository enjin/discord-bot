# Enjin Discord Bot

## Overview

This Discord bot, developed by Enjin, utilizes Discord.js and Bun runtime to facilitate role assignment based on tokens held in users' Enjin wallets. The primary purpose of this bot is to assign discord roles to members if they hold the specific token configured by the server admin.

## Getting Started

### Invite the Bot

To add the Enjin Discord bot to your guild (server), click on the following link: [Invite Enjin Bot](https://enjin.io/discord-bot)

### Setting Up Rules (only for Admin)

1. **Invite the Bot:** Use the provided link to invite the Enjin bot to your guild.

2. **Run Setup Command:** In your Discord server, use the slash command `/setup` to initiate the setup process.

3. **Add Conditions:** Follow the prompts to add rule for a token, repeat again to add rule for more tokens. 

### Viewing Rules

To check all existing rules, use the slash command `/list`. This will provide a list of tokens and it's role assignments.

### Connecting Enjin Wallet

1. **Run Connect Command:** Members can connect their Enjin wallet to the Discord server by using the command `/connect`.

2. **Follow Instructions:** The bot will guide users through the process of connecting their wallet.

3. **Role Assignment:** If a user holds the any token configured by the server admin, the corresponding roles will be assigned to the user.

### Note for Self-Hosting

If you plan to self-host this bot, ensure that it has the necessary permissions. The required permission integer is `275146345536`.



## Support and Feedback

For any issues, questions, or feedback, please contact Enjin Support at [support@enjin.io](mailto:support@enjin.io).

