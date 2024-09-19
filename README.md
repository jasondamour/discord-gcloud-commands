# Discord Bot for GCP Compute Engine

This is the source code for a discord "bot" to list, start, and stop GCP compute instances. This is super useful if someone in the discord knows how to configure VMs for game servers, and other discord users just need to start and stop the instances. I'm going to refer to the code in this repo as the "Application" for the rest of the readme (cuz its technically not a bot in the recommended setup).

## Use case

1. Set up a Compute Instance in GCP to host a game server, configured so that the process starts when the Compute Instance starts
2. Set up this Application in GCP, either in Compute Engine, Cloud Run, or Cloud Functions (Functions is recommended, as its cheapest)
3. Users in the Discord server can now turn on and off the custom game servers! Want to play a bit of Minecraft without messaging that annoying nerdy kid to turn on the server? No Problem!

## Commands
The commands shipped with this repo are fairly simple. Typing `/servers` into a Discord server with the commands will bring up the autocomplete menu, with more details about each command.

```
  basic commands to check compute instances:
  /servers list
  /servers start (name) [zone]
  /servers stop (name) [zone]

  more advanced commands to interact with running servers
  /rcon (host) (port) (password) (command)
```

# Deploying the Bot

## General
The bot can be deployed several different ways, and supports old and new styles of authentication. For most situations I strongly recommend deploying on **Google Cloud Functions** with **Application Commands** auth scope, for cheapest and most secure. More on those two in the next sections.  


If you need raw access to the `gcloud` CLI tool, you can deploy this Application to Google Cloud Run, a platform which runs docker containers serverlessly for you. It has some major drawbacks:
  - your command cannot take longer than 3 seconds to run. Discord requires an initial response within 3 seconds, and Cloud Run cannot run async tasks to respond after the inital ack.
  - Since Cloud Run scales down to 0, your first command may have a "cold start" delay as it scales up. This would pretty much throw away your first command each hour.

If you need raw access to the `gcloud` CLI **AND** an always-listening bot, you can host this Application on a typical Compute Instance. This is the common practice to hosting Discord bots, and many other guides go more in depth on how to do this. The only major drawback is price. The following is the [cost to run 1,000 commands per month on each platform](https://cloud.google.com/products/calculator/#id=c83d9bf1-d49d-4a54-b275-3edda13a1ef3):

  | Name                    | Value                                    |
  |-------------------------|------------------------------------------|
  | Google Cloud Functions  | Free! (up to ~100,000 commands)          |
  | Google Cloud Run        | Free! (up to ~2 million commands)        |
  | Google Compute Engine   | ~$8-$12 Flat per month                   |

This Application is built on Discords new [Slash Commands](https://discord.com/developers/docs/interactions/slash-commands) platform (big thanks to [Snazzah](https://github.com/Snazzah/slash-create)). While a typical bot user would need to be invited to a server to scan *all* messages for relevant commands, this Application only gets notified by Discord if someone uses the specific command. This is far more secure. So when setting up Auth for the Discord App, I recommend to use the [Application Commands](https://discord.com/developers/docs/interactions/slash-commands#authorizing-your-application) auth scope.

## Prerequisites
1. [Have a Google Cloud Platform account and Project](https://cloud.google.com/)
2. [Create an Application in Discord Dev Portal](https://discord.com/developers/applications).
3. Invite the Application to your Discord Server.
  - `CLIENT_ID` comes from your Application page in the Discord Developer Portal
  - If your application only uses slash commands (you have not modified this Application), then `SCOPE` is `applications.commands`.
  - If you're modifying this Application and need a typical bot with presence, then `SCOPE` is `applications.commands%20bot`. Replace the values, then paste the following in your browser:
```
https://discord.com/oauth2/authorize?client_id=[CLIENT_ID]&scope=[SCOPE]
```

## Google Cloud Functions
1. Go to the [Google Cloud Functions console](https://console.cloud.google.com/functions). Make sure the API is enabled, then click the `Create Function` button.
2. Fill out the first page

  | Field                       | Value                                                                                                         |
  |-----------------------------|---------------------------------------------------------------------------------------------------------------|
  | Name                        | I chose `discord-app`, but go nuts.                                                                           |
  | Region                      | Choose the [region](https://cloud.google.com/about/locations) closest to your users                           |
  | Trigger                     | Choose **HTTP**, and **Allow unauthenticated invocations**. Take note of the Trigger URL.                     |
  | Advanced: Memory Allocation | 128MiB                                                                                                        |
  | Advanced: Timeout           | 60                                                                                                            |
  | Advanced: Service Account   | App Engine Default service account                                                                            |
  | Environment Variables       | [*see below*](#environment-variables)                                                                        |

3. Press `Next`. On the `Source` page, set Function entry point to `interactions` (see https://github.com/jasondamour/discord-gcloud-commands/issues/1). You'll also need to copy the source code files. I recommend just using the file editor. Delete all the default files, and create the following, copying the contents.
  - package.json (edit the `main` property to be `cloud-functions.js`)
  - cloud-functions.js
  - commands/servers.js
4. Press Deploy! Wait for the function to go green (hopefully :) ) and then copy the Trigger URL. At this point, if you go to your discord server and type a `/`, you should see the autocomplete prompt for your commands appear. If you did not pass the ID of the Guild (Discord Server), then there is a 1 hour delay in updating commands.
5. Go back to the Discord developer portal and paste the Trigger URL in the `INTERACTIONS ENDPOINT URL` field. If the Function started correctly, then discord will accept the URL when you save.
6. Test your commands!

## Google Cloud Run
1. Ensure you have enabled [Google Container Registry](https://console.cloud.google.com/gcr) for your project, and you have [gcloud installed](https://cloud.google.com/sdk/docs/install). Make sure you have [Docker installed](https://docs.docker.com/get-docker/) and its started.
2. Login to your GCP project by running `gcloud auth login`.
3. Authenticate Docker to the registry, by running `gcloud auth configure-docker`
4. Build and Publish the Docker image that will be used. From the root of this repository, run `docker build . -t gcr.io/[GCP_PROJECT_ID]/discord-bot && docker push gcr.io/[GCP_PROJECT_ID]/discord-bot`
5. Go to [Google Cloud Run console](https://console.cloud.google.com/run) and click `Create Service`
6. Fill out the first page

  | Field                       | Value                                                                                |
  |-----------------------------|--------------------------------------------------------------------------------------|
  | Deployment platform         | Cloud Run (fully managed)                                                            |
  | Region                      | Choose the [region](https://cloud.google.com/about/locations) closest to your users  |
  | Name                        | I chose `discord-app`, but go nuts.                                                  |
  | Deploy from an existing image | gcr.io/[GCP_PROJECT_ID]/discord-bot                                                |
  | Trigger                     | Choose **HTTP**, **Allow all traffic**, and **Allow unauthenticated invocations**.   |

7. Press Deploy! Wait for the service to go green (hopefully :) ) and then copy the Trigger URL. At this point, if you go to your discord server and type a `/`, you should see the autocomplete prompt for your commands appear. If you did not pass the ID of the Guild (Discord Server), then there is a 1 hour delay in updating commands.

8. Go back to the Discord developer portal and paste the Trigger URL in the `INTERACTIONS ENDPOINT URL` field. If the Function started correctly, then discord will accept the URL when you save.

## Google Compute Engine
If you're deploying to Compute Engine, I'm going to assume you are more familiar with Discord Bots and the technologies in general, so this tutorial is far more high level. If you are not familiar, please find one of the hundreds of other "Discord Bot" tutorials out there.

1. Create a Compute Instances. Machine Type `e2-micro` was large enough for me, but it all depends on your bot's workload.
2. SSH to the Compute Instance and clone this repo. Install Node 8 or later (tested with 12).
3. Set the [Environment Variables](#environment-variables) either directly from the shell using `export`, or a `.env` file.
4. If your Application is a Bot, then you probably want to run using the Discord.js gateway. It can be started using `node src/gateway.js` and you're done.
5. If your application only uses Interactions (slash commands), then you can run an Express.js Server and receive webhooks. Run `node src/web-server.js`, and configure a route from the public internet to the instances. Easiest way is to just configure a public IP for the instance. Paste the IP into the Discord dev portal.

## Environment Variables
This Application requires the following variables at runtime:

  | Name                        | Value                                                                                                           |
  |-----------------------------|-----------------------------------------------------------------------------------------------------------------|
  | DISCORD_APPLICATION_ID      | The Application ID from the Discord developer portal (AKA Client ID)                                            |
  | DISCORD_PUBLIC_KEY          | The Public Key from the Discord developer portal                                                                |
  | DISCORD_TOKEN               | The Client Secret from the Discord developer portal                                                             |
  | DISCORD_GUILD_ID            | [optional, but strongly recommended] The ID of the discord server to register commands. 1 hour delay if not set |
  | GCLOUD_PROJECT              | The GCP Project ID                                                                                              |
  | DEFAULT_COMPUTE_ZONE        | [optional] The default zone to use for Compute Engine                                                           |
  | USER_ROLE_ID                | The Role ID of low-permission users who can list, start, and stop instances                                     |
  | MANAGER_ROLE_ID             | The Role ID of high-permission users who can directly run RCON commands                                         |

> If you face any problems, feel free to create an Issue from the Issues tab. I will try to respond as early as possible.
