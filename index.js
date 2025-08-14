const { Client, GatewayIntentBits, Collection, Events } = require("discord.js");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const http = require("http");

// Environment variables
const token = process.env.DISCORD_TOKEN;
const mongoUri = process.env.MONGODB_URI;
const port = process.env.PORT || 3000;

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Create a collection for commands
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, "command");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded command: ${command.data.name}`);
  } else {
    console.log(
      `⚠️ The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

// Load events
const eventsPath = path.join(__dirname, "event");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(client, ...args));
  }
  console.log(`✅ Loaded event: ${event.name}`);
}

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Error executing command:", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

// When the client is ready
client.once(Events.ClientReady, (readyClient) => {
  console.log(`🚀 Ready! Logged in as ${readyClient.user.tag}`);
});

// Connect to MongoDB
async function connectDB() {
  try {
    let dbUri = mongoUri || "mongodb://localhost:27017/discord";

    // Ensure the database name is "discord" if using MongoDB Atlas
    if (mongoUri && !mongoUri.includes("/discord")) {
      // If using Atlas and no database specified, append /discord
      if (mongoUri.includes("mongodb+srv://") && !mongoUri.includes("/?")) {
        dbUri = mongoUri + "/discord";
      } else if (
        mongoUri.includes("mongodb+srv://") &&
        mongoUri.includes("/?")
      ) {
        dbUri = mongoUri.replace("/?", "/discord?");
      }
    }

    console.log("🔄 Attempting to connect to MongoDB...");
    console.log("📍 Database URI:", dbUri.replace(/\/\/.*@/, "//***:***@")); // Hide credentials in logs

    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:");
    console.error("Error details:", error.message);

    if (error.message.includes("IP address")) {
      console.error(
        "🔥 SOLUTION: Whitelist 0.0.0.0/0 in MongoDB Atlas Network Access"
      );
    }
    if (error.message.includes("authentication failed")) {
      console.error(
        "🔥 SOLUTION: Check your MongoDB username/password in the connection string"
      );
    }
    if (error.message.includes("timeout")) {
      console.error("🔥 SOLUTION: Check MongoDB Atlas Network Access settings");
    }

    process.exit(1);
  }
}

// Keep the process alive (important for Railway)
process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Start the bot
async function startBot() {
  try {
    await connectDB();
    await client.login(token);

    // Create a simple HTTP server for health checks
    const server = http.createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "OK",
            bot: client.user ? client.user.tag : "Not ready",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    });

    server.listen(port, () => {
      console.log(`🌐 Health check server running on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start the bot:", error);
    process.exit(1);
  }
}

startBot();
