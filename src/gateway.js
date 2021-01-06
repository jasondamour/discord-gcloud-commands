const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') })

// Slach Create and related libs
const { SlashCreator, GatewayServer } = require('slash-create');
const CatLoggr = require('cat-loggr');
const logger = new CatLoggr().setLevel(process.env.COMMANDS_DEBUG === 'true' ? 'debug' : 'info');

// System Exec lib
const execSync = require('child_process').execSync;

// Discord lib
const Discord = require('discord.js');
const client = new Discord.Client();

// Constants
const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const creator = new SlashCreator({
  applicationID: DISCORD_APPLICATION_ID,
  publicKey: DISCORD_PUBLIC_KEY,
  token: DISCORD_TOKEN,
});

creator.on('debug', (message) => logger.log(message));
creator.on('warn', (message) => logger.warn(message));
creator.on('error', (error) => logger.error(error));
creator.on('synced', () => logger.info('Commands synced!'));
creator.on('commandRun', (command, _, ctx) =>
  logger.info(`${ctx.member.user.username}#${ctx.member.user.discriminator} (${ctx.member.id}) ran command ${command.commandName}`));
creator.on('commandRegister', (command) =>
  logger.info(`Registered command ${command.commandName}`));
creator.on('commandError', (command, error) => logger.error(`Command ${command.commandName}:`, error));

console.log("Starting GatewayServer");

creator
  .withServer(new GatewayServer((handler) => client.ws.on('INTERACTION_CREATE', handler)))
  .registerCommandsIn(path.join(__dirname, 'commands'))
  .syncCommands();

client.login(DISCORD_TOKEN);
