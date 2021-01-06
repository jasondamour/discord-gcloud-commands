const { SlashCommand, CommandOptionType } = require('slash-create');
const Rcon = require('rcon-ts').Rcon;
const Discord = require('discord.js');

const MANAGER_ROLE_ID = process.env.MANAGER_ROLE_ID || '789078608236511252';

module.exports = class RconCommand extends SlashCommand {
  constructor(creator) {
    super(creator, {
      name: 'rcon',
      description: 'Interact with RCON game managment servers',
      guildID: process.env.DISCORD_GUILD_ID,
      deleteCommands: true,
      options: [
        {
          name: 'run',
          description: 'Run raw RCON commands',
          type: CommandOptionType.SUB_COMMAND,
          options: [
            {
              name: 'host',
              description: 'Host IP',
              type: CommandOptionType.STRING,
              required: true
            },
            {
              name: 'port',
              description: 'Host IP (default 25575)',
              type: CommandOptionType.INTEGER,
              required: true
            },
            {
              name: 'password',
              description: 'RCON server password',
              type: CommandOptionType.STRING,
              required: true
            },
            {
              name: 'command',
              description: 'RCON command to execute',
              type: CommandOptionType.STRING,
              required: true
            }
          ]
        }
      ]
    });
  }

  async run(ctx) {
    var subcommand = ctx.subcommands[0];

    if (subcommand == "run" && ctx.member.roles.includes(MANAGER_ROLE_ID)) {
      await ctx.acknowledge();

      const HOSTNAME = ctx.options[subcommand].host;
      const HOSTPORT = ctx.options[subcommand].port || 25575;
      const PASSWORD = ctx.options[subcommand].password;
      const COMMAND = ctx.options[subcommand].command || "/help";

      const rcon = new Rcon({
        host: HOSTNAME,
        password: PASSWORD,
        port: HOSTPORT,
        timeout: 5000
      });

      rcon
        .session(c => c.send(COMMAND))
        .then(
          (response) => { ctx.send({ embeds: [ generateEmbedMessage(ctx.member.displayName, HOSTNAME + ":" + HOSTPORT + " " + COMMAND, response, "success") ] }) },
          (response) => { ctx.send({ embeds: [ generateEmbedMessage(ctx.member.displayName, HOSTNAME + ":" + HOSTPORT + " " + COMMAND, response, "fail") ] }) }
        );
    }
  }
}

function generateEmbedMessage(member, input, response, status) {
  console.log(input);
  console.log(response);
  const embed = new Discord.MessageEmbed()
  	.setColor((status == "success")? '#00b400' : '#b40000')
  	.setTitle("```" + input + "```")
  	.setDescription("```" + response + "```")
  	.setFooter('Run by ' + member);
  return embed;
}
