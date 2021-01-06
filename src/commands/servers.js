const { SlashCommand, CommandOptionType } = require('slash-create');
const stringTable = require('string-table');
const Compute = require('@google-cloud/compute');
const compute = new Compute();

const USER_ROLE_ID = process.env.USER_ROLE_ID || '789184783942549545';
const MANAGER_ROLE_ID = process.env.MANAGER_ROLE_ID || '789078608236511252';
const DEFAULT_COMPUTE_ZONE = process.env.DEFAULT_COMPUTE_ZONE || 'us-west2-a';

const PRESENT_VERBS = {
  start: "Starting",
  stop: "Stopping"
}
const PAST_VERBS = {
  start: "Started",
  stop: "Stopped"
}

module.exports = class ServersCommand extends SlashCommand {
  constructor(creator) {
    super(creator, {
      name: 'servers',
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
              description: 'Instance zone (default ' + DEFAULT_COMPUTE_ZONE +  ')',
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
    var subcommand = ctx.subcommands[0];

    if (subcommand == "list" && (ctx.member.roles.includes(USER_ROLE_ID) || ctx.member.roles.includes(MANAGER_ROLE_ID))) {
      await ctx.acknowledge(true);
      var table = [];
      compute.getVMs((err, vms) => {
        if (err) {
          ctx.send( "```" + err.errors[0].message + " (" + err.code + ")```");
        }
        else {
          for (var vm of vms) {
            var extIp = ( vm.metadata.networkInterfaces[0].accessConfigs == undefined )? "N/A" : vm.metadata.networkInterfaces[0].accessConfigs[0].natIP;
            var row = {
              "name": vm.name,
              "zone": vm.zone.name,
              // "Internal IP": vm.metadata.networkInterfaces[0].networkIP,
              "external IP": extIp,
              "status": vm.metadata.status
            }
            console.log(row);
            table.push(row);
          }
        }
        var response = stringTable.create(table, { capitalizeHeaders: true, outerBorder: ' '});
        console.log(response);
        ctx.send("```" + response + "```");
      });
    }

    else if ((subcommand == "start" || subcommand == "stop") && (ctx.member.roles.includes(USER_ROLE_ID) || ctx.member.roles.includes(MANAGER_ROLE_ID))) {
      await ctx.acknowledge(true);
      const zoneName = (ctx.options[subcommand].zone == undefined)? DEFAULT_COMPUTE_ZONE : ctx.options[subcommand].zone;
      const zone = compute.zone(zoneName);
      const vm = zone.vm(ctx.options[subcommand].name);

      await vm [subcommand] ( (err, operation) => {
        if (err) {
          console.log(err)
          ctx.send( "```" + err.errors[0].message + " (" + err.code + ")```");
        }
        else {
          var message = PRESENT_VERBS[subcommand] + " " + vm.name + "...";
          console.log(message);
          ctx.send("```" + message + "```");
          operation.on('complete', (metadata) => {
            var message = PAST_VERBS[subcommand] + " " + vm.name + "!";
            console.log(message);
            ctx.send("```" + message + "```");
          });

          operation.on('error', (err) => {
            console.log(err);
            ctx.send( "```" + err.errors[0].message + " (" + err.code + ")```");
          });
        }
      });
    }
    else {
      ctx.send("Unrecognized Command or Insufficient Permissions");
    }
  }
}
