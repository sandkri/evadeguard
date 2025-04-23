# EvadeGuard Discord Bot

![GitHub last commit](https://img.shields.io/github/last-commit/sandk/EvadeGuard)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/sandk/EvadeGuard)
![GitHub code size](https://img.shields.io/github/languages/code-size/sandk/EvadeGuard)
![License](https://img.shields.io/badge/license-MIT-blue)

EvadeGuard is a smart moderation Discord bot that prevents timeout evasion by tracking and escalating punishments when users attempt to circumvent server timeouts.

## Features

- 🔒 **Timeout Evasion Detection**: Automatically tracks and manages users who leave during timeouts
- 📧 **Appeal System**: Built-in commands for users to appeal punishments
- ⚙️ **Server Configuration**: Easy server settings management via slash commands
- 🗃️ **Database Storage**: Reliable SQLite database with automatic data management

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Setup

1. Clone the repository:

```bash
git clone https://github.com/sandk/EvadeGuard.git
cd EvadeGuard
```

2. Install dependencies:

```bash
npm install
```

3. Create a .env file in the root directory:

```ini
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
```

4. Start the bot:

```bash
node src/bot.js
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | Yes | Your Discord bot token from Discord Developer Portal |
| `CLIENT_ID` | Yes | Your Discord application ID |

### Server Settings

Use the `/set` command to configure your server:

```
/set appeal #channel-name  # Sets the channel where appeals are sent
```

## Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/set appeal` | Set the appeal channel | Administrator |
| `/appeal create` | Submit an appeal | Everyone |
| `/appeal accept` | Accept a user's appeal | Manage Guild |
| `/appeal deny` | Deny a user's appeal | Manage Guild |

## Project Structure

```
evadeguard/
├── src/
│   ├── commands/         # Bot slash commands
│   │   ├── manager/      # Administrative commands
│   │   └── system/       # Core functionality commands
│   ├── handlers/         # Event handlers
│   │   └── events/       # Discord.js event handlers
│   ├── services/         # Background services
│   │   └── moderation/   # Moderation related services
│   ├── utility/          # Utility functions
│   │   └── database/     # Database models and functions
│   └── bot.js            # Main entry point
└── .env                  # Environment variables
```

## Database

EvadeGuard uses SQLite for data storage:

- **Users**: Stores timeout and punishment information 
- **Servers**: Stores server configuration settings

The database automatically creates backups to prevent data loss.

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security

- All bot commands use appropriate permission checks
- Server settings are isolated to prevent cross-server access
- Database operations use parameterized methods to prevent injection

---

<p align="center">Made by Sander Kristiansen</p>