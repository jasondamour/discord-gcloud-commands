// Imports
const { SlashCreator, ExpressServer } = require('slash-create');
const path = require('path');
const execSync = require('child_process').execSync;

const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const SERVER_HOST = process.env.SERVER_HOST || "0.0.0.0"
const PORT = process.env.PORT || 8080;
const ENDPOINT_PATH = process.env.ENDPOINT_PATH || "";
const DEFAULT_COMPUTE_ZONE = process.env.DEFAULT_COMPUTE_ZONE || 'us-west2-a';

const creator = new SlashCreator({
  applicationID: DISCORD_APPLICATION_ID,
  publicKey: DISCORD_PUBLIC_KEY,
  token: DISCORD_TOKEN,
  serverHost: SERVER_HOST,
  serverPort: PORT,
  endpointPath: ENDPOINT_PATH
});

console.log("Starting server on " + SERVER_HOST + ":" + PORT + ENDPOINT_PATH);
execSync("gcloud config set compute/zone " + DEFAULT_COMPUTE_ZONE);

creator
  .registerCommandsIn(path.join(__dirname, 'commands'))
  .syncCommands()
  .withServer(new ExpressServer())
  .startServer();

console.log("server started!");
