// Imports
const { SlashCreator, GCFServer } = require('slash-create');
const path = require('path');


const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const creator = new SlashCreator({
  applicationID: DISCORD_APPLICATION_ID,
  publicKey: DISCORD_PUBLIC_KEY,
  token: DISCORD_TOKEN,
});

creator
  .withServer(new GCFServer(module.exports))
  .registerCommandsIn(path.join(__dirname, 'commands'))
  .syncCommands();
