const { SlashCommand, CommandOptionType } = require('slash-create');
const execSync = require('child_process').execSync;

const USER_ROLE_ID = process.env.USER_ROLE_ID || '789184783942549545';


module.exports = class ServersCommand extends SlashCommand {
  constructor(creator) {
    super(creator, {
      name: 'gcloud',
      description: 'Interact with GCP Compute Engine Instances',
      guildID: process.env.DISCORD_GUILD_ID,
      deleteCommands: true,
      options: [
        {
          name: 'list',
          description: 'List Compute Instances and statuses',
          type: CommandOptionType.SUB_COMMAND
        },
        {
          name: 'start',
          description: 'Start Compute Instances',
          type: CommandOptionType.SUB_COMMAND,
          options: [
            {
              name: 'name',
              description: 'Instance name',
              type: CommandOptionType.STRING,
              required: true
            },
            {
              name: 'zone',
              description: 'Instance zone (default us-west2-a)',
              type: CommandOptionType.STRING,
              required: false
            }
          ]
        },
        {
          name: 'stop',
          description: 'Stop Compute Instances',
          type: CommandOptionType.SUB_COMMAND,
          options: [
            {
              name: 'name',
              description: 'Instance name',
              type: CommandOptionType.STRING,
              required: true
            },
            {
              name: 'zone',
              description: 'Instance zone (default us-west2-a)',
              type: CommandOptionType.STRING,
              required: false
            }
          ]
        }
      ]
    });
  }

  async run(ctx) {
    if (ctx.member.roles.includes(USER_ROLE_ID)) {
      var subcommand = ctx.subcommands[0];
      await ctx.acknowledge();

      if (subcommand == "list") {
        var gcloudCommand = "gcloud compute instances list";
        console.log(gcloudCommand);
        var response = execSync(gcloudCommand).toString();
        console.log(response);
        ctx.send( "```" + response + "```");
      }

      else if (subcommand == "start") {
        var gcloudCommand = "gcloud compute instances start";
        for (var option in ctx.options[subcommand]) {
          if (option == "name") gcloudCommand += " " + ctx.options[subcommand][option];
          else gcloudCommand += " --" + option + "=\"" + ctx.options[subcommand][option] + "\"";
        }
        console.log(gcloudCommand);
        var response = execSync(gcloudCommand).toString();
        console.log(response);
        ctx.send( "```" + response + "```");
      }

      else if (subcommand == "stop") {
        var gcloudCommand = "gcloud compute instances stop";
        for (var option in ctx.options[subcommand]) {
          if (option == "name") gcloudCommand += " " + ctx.options[subcommand][option];
          else gcloudCommand += " --" + option + "=\"" + ctx.options[subcommand][option] + "\"";
        }
        console.log(gcloudCommand);
        var response = execSync(gcloudCommand).toString();
        console.log(response);
        ctx.send( "```" + response + "```");
      }
    }
    else {
      ctx.send("Insufficient Permissions");
    }
  }
}
