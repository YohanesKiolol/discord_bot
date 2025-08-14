# Discord Bot

A simple Discord bot built with Node.js and discord.js that responds to basic commands.

## Features

- Responds to "hello" with "Hello!"
- Responds to "!ping" with "Pong!"
- Basic message filtering (ignores bot messages)

## Prerequisites

- Node.js (version 16.9.0 or higher)
- A Discord application and bot token

## Setup Instructions

### 1. Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section in the left sidebar
4. Click "Add Bot"
5. Copy the bot token (you'll need this for step 3)

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

1. Copy the `.env` file and add your bot token:

```bash
DISCORD_TOKEN=your_actual_bot_token_here
```

### 4. Invite Bot to Your Server

1. In the Discord Developer Portal, go to OAuth2 > URL Generator
2. Select "bot" scope
3. Select the permissions your bot needs:
   - Send Messages
   - Read Message History
   - Use Slash Commands (optional)
4. Copy the generated URL and open it in your browser
5. Select a server and authorize the bot

### 5. Run the Bot

```bash
npm start
```

## Usage

Once the bot is running and invited to your server:

- Type `hello` in any channel where the bot has access - it will reply with "Hello!"
- Type `!ping` in any channel - it will reply with "Pong!"

## Development

To run the bot in development mode:

```bash
npm run dev
```

## Project Structure

```
discord_bot/
├── index.js              # Main bot file
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables (not in git)
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## Customization

To add more commands or features:

1. Edit `index.js`
2. Add new event listeners for different message patterns
3. Implement slash commands for more advanced functionality
4. Add more intents if needed for additional Discord features

## Common Issues

- **Bot doesn't respond**: Check that the bot has the necessary permissions in your server
- **Token errors**: Make sure your `.env` file contains the correct bot token
- **Missing messages**: Ensure the bot has the `MessageContent` intent enabled

## Resources

- [discord.js Documentation](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord API Documentation](https://discord.com/developers/docs)
