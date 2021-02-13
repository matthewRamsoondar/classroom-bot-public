const { SSL_OP_EPHEMERAL_RSA } = require('constants');
const fs = require('fs');
const authenticate = require('../authenticate.js');
var classroom;
var userName;
var className;

async function sendEmbed(guild, channel) {
    const { authReady, courseReady, courseName, userToken } = JSON.parse(fs.readFileSync(`./guilds/${guild.id}/config.json`));
    if (authReady) {
        await createAuth(userToken);
        let profile = classroom.userProfiles.get({ userId: 'me' });
        profile.then(user => {
            userName = user.data.name.fullName;
        });
        await sleep(2000);
    } else {
        userName = '-No bound account-';
    }
    if (courseReady) {
        className = courseName;
    } else {
        className = '-No bound class-';
    }
    let date = new Date().toUTCString();
    let embed = {
        title: "Classroom Bot Help",
        description: `\n__**Server Bound Account:**__ **\n${userName}\n**__**Server Bound Course:**__\n**${className}**\n\nThe Google Classroom Bot is a simple bot to monitor your google classroom course announcements and assignments. Most commands have a 30 second input for codes, ID's, etc. \nPlease enjoy!`,
        color: '7289DA',
        timestamp: date,
        fields: [
            {
                name: "Setup Command",
                value: "`c!setup`\nPrompts user through the bot setup process (account linking & course linking). Please use this command to reset the account that the bot is linked to."
            },
            {
                name: "Courses Command",
                value: "`c!courses`\nPrompts user through the course binding process, just paste the course ID of the course you want and the bot will bind to it."
            },
            {
                name: "Stream Command",
                value: "`c!stream`\nJust simply call the command in the channel you would like the bot to stream the notifications to and it will automatically set."
            },
            {
                name: "Latest Assignment",
                value: "`c!assignment`\nCall this command to get an embed of the latest assignment from the class that the bot is bound to."
            },
            {
                name: "Latest Announcement",
                value: "`c!announce`\nCall this command to get an embed of the latest announcement from the class that the bot is bound to."
            },
        ],
        footer: {
            text: "Thank you for using classroom bot"
        }
    }
    channel.send({ embed: embed});
}

function createAuth(token) {
    return new Promise((resolve, reject) => {
        classroom = authenticate.execute(token);
        resolve();
    });
}

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = {
    name: 'help',
    execute(guild, channel, args) {
        sendEmbed(guild, channel);
    }
}