const fs = require('fs');

function changeChannel(guild, channel, newChannel) {
    channel.send(`**Now streaming to ${channel.name}**`);
    const config = require(`../guilds/${guild.id}/config.json`);
    config.streamChannelID = newChannel;
    fs.unlinkSync(`guilds/${guild.id}/config.json`);
    fs.writeFileSync(`guilds/${guild.id}/config.json`, JSON.stringify(config));
    const monitor = require(`../guilds/${guild.id}/monitor.js`);
    monitor.execute(guild);
}


module.exports = {
    name: 'stream',
    execute(guild, channel) {
        var newChannelID = channel.id;
        changeChannel(guild, channel, newChannelID);
    }
}