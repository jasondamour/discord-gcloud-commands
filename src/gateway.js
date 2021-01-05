// Imports
const { SlashCreator, GatewayServer } = require('slash-create');
const path = require('path');
const execSync = require('child_process').execSync;

const Discord = require('discord.js');
const client = new Discord.Client();

require('dotenv').config({ path: path.resolve(__dirname, '../dev.env') })
const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const creator = new SlashCreator({
  applicationID: DISCORD_APPLICATION_ID,
  publicKey: DISCORD_PUBLIC_KEY,
  token: DISCORD_TOKEN,
});

console.log("Starting GatewayServer");

creator
  .withServer(new GatewayServer((handler) => client.ws.on('INTERACTION_CREATE', handler)))
  .registerCommandsIn(path.join(__dirname, 'commands'))
  .syncCommands();

client.login(DISCORD_TOKEN);
