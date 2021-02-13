const Discord = require('discord.js');
const client = new Discord.Client();
const { scopes } = require('./scopes.json');
const fs = require('fs');
const prefix = 'c!';
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
client.commands = new Discord.Collection();
client.login('BOT TOKEN');

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.on("ready", () => {
    client.user.setActivity('c!help', { type: 'WATCHING' });
});

client.on("guildCreate", guild => {
    const addGuild = require('./addGuild.js');
    addGuild.execute(guild, undefined);
});

client.on("message", message => {
    if (message.content.startsWith(prefix)) {
        if (message.content === `${prefix}setup`) {
            const addGuild = require('./addGuild');
            addGuild.execute(message.guild, message.channel);
        } else if (message.content === `${prefix}courses`) {
            const courses = require('./commands/courses');
            courses.execute(message.guild, message.channel);
        } else if (message.content === `${prefix}help`) {
            const help = require('./commands/help');
            help.execute(message.guild, message.channel);
        } else {
            var guild = message.guild;
            var channel = message.channel;
            var { authReady, courseReady} = JSON.parse(fs.readFileSync(`./guilds/${guild.id}/config.json`));
            if (!authReady && !courseReady) {
                message.channel.send('Please run the c!setup command');

            } else if (authReady && !courseReady) {
                message.channel.send('Please bind a course using the c!courses command');

            } else if (authReady && courseReady) {
                const [CMD_NAME, ...args] = message.content.trim().substring(prefix.length).split(' ');
                if (!(client.commands.has(CMD_NAME))) return;

                try {
                    client.commands.get(CMD_NAME).execute(guild, channel, args);
                } catch (error) {
                    console.log(error);
                }
            }
        }
    }
});
