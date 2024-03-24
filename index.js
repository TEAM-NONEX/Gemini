const express = require("express");
const app = express();
const port = 3000;

// Middleware to serve static files from the 'public' directory
app.use(express.static('public'));

// Route handling for the root URL
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

const discord = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const MODEL = "gemini-pro";
const API_KEY = process.env.API_KEY || "";
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const CHANNEL_ID = process.env.CHANNEL_ID || "";

const ai = new GoogleGenerativeAI(API_KEY);
const model = ai.getGenerativeModel({ model: MODEL });

const client = new discord.Client({
  intents: Object.keys(discord.GatewayIntentBits),
});

client.on("ready", () => {
  console.log("Bot is ready!");
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (message.channel.id !== CHANNEL_ID) return;

    // Ignore messages that don't contain any meaningful content
    if (!message.content.trim()) {
      return;
    }

    await message.channel.sendTyping();
    
    const { response } = await model.generateContent(message.content);

    // Check if there is anything to say
    const generatedText = response.text().trim();
    if (!generatedText) {
      message.reply("I have nothing to say.");
      return;
    }

    // Check if the response was blocked due to safety
    if (response.text().includes("Response was blocked due to SAFETY")) {
      message.reply("I'm sorry, but I can't provide that response to keep the content safe and clean.");
      return;
    }

    // Check if the generated text is too long for Discord to handle
    if (generatedText.length > 2000) {
      message.reply("I have too much to say for Discord to fit in one message.");
    } else {
      message.reply({
        content: generatedText,
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error.stack);
  }
});

// Import the ping command
const pingCommand = require('./ping.js');

// Register the ping command
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === pingCommand.name) {
    try {
      await pingCommand.callback(client, interaction);
    } catch (error) {
      console.error('Error executing ping command:', error);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  } else if (interaction.commandName === 'your_other_command') {
    // Handle other commands similarly
  }
});

// Log in to Discord
client.login(BOT_TOKEN);

