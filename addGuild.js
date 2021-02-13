const fs = require('fs');
const { google } = require('googleapis');
const { installed } = require('./credentials.json');
const { client_id, client_secret, redirect_uris } = installed;
const { scopes } = require('./scopes.json');
const monitorSample = fs.readFileSync('./monitorSample.txt').toString();

var coursesData = [];
var defaultConfig = {
    authReady: false,
    courseReady: false,
    courseName: undefined,
    courseID: undefined,
    streamChannelID: undefined,
    userToken: undefined
}

function check(guild) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(`./guilds/${guild.id}`)) {
            fs.readdirSync(`./guilds/${guild.id}`).forEach(file => {
                var curPath = `./guilds/${guild.id}/${file}`;
                fs.unlinkSync(curPath);
            });
            fs.rmdirSync(`./guilds/${guild.id}`);
        }
        resolve();
    });
}

function createGuild(guild, channel) {
    fs.mkdirSync(`./guilds/${guild.id}`);
    promptAuth(guild, channel);
    fs.writeFileSync(`./guilds/${guild.id}/monitor.js`, monitorSample);
}

function promptAuth(guild, c) {
    var channel;
    if (c === undefined) {
        channel = guild.systemChannel;
    } else {
        channel = c;
    }
    defaultConfig = {
        authReady: false,
        courseReady: false,
        courseName: undefined,
        courseID: undefined,
        streamChannelID: undefined,
        userToken: undefined
    }
    var oAuth2Client = getClient();
    channel.send({ embed: getLink(oAuth2Client) }).then(async message => {
        await sleep(30000);
        message.react('❌');
    });
    const filter = m => m.author.bot != true;
    channel.awaitMessages(filter, { max: 1, time: 30000 }).then(collected => {
        if (collected.first() != undefined) {
            let code = collected.first().content;
            tryAuth(code, oAuth2Client).then(res => {
                if (res.status) {
                    defaultConfig.authReady = true;
                    defaultConfig.userToken = res.token;
                    oAuth2Client.setCredentials(res.token);
                    channel.send('**✅ Successful authentication**');
                    promptCourse(oAuth2Client, channel);
                    channel.awaitMessages(filter, { max: 1, time: 30000 }).then(rep => {
                        if (rep.first() != undefined) {
                            var sentId = rep.first().content;
                            if (coursesData.some(course => course.id === sentId)) {
                                var courseName = coursesData.find(course => course.id === sentId).name;
                                var courseId = sentId;
                                defaultConfig.courseReady = true;
                                defaultConfig.courseID = courseId;
                                defaultConfig.courseName = courseName;
                                defaultConfig.streamChannelID = c.id;
                                fs.writeFile(`./guilds/${guild.id}/config.json`, JSON.stringify(defaultConfig), () => {
                                    const monitor = require(`./guilds/${guild.id}/monitor.js`);
                                    monitor.execute(guild);
                                    channel.send(`**✅ Successfully bound to ${courseId} - ${courseName}**`);
                                });
                            } else {
                                fs.writeFileSync(`./guilds/${guild.id}/config.json`, JSON.stringify(defaultConfig));
                                channel.send(`**❌ Unsuccessful bind to ${sentId}**`);
                            }
                        } else {
                            fs.writeFileSync(`./guilds/${guild.id}/config.json`, JSON.stringify(defaultConfig));
                            channel.send(`**❌ class binding failed**`);
                        }
                    });
                } else {
                    channel.send('**❌ Unsuccessful authentication, please retry**');
                    fs.writeFileSync(`./guilds/${guild.id}/config.json`, JSON.stringify(defaultConfig));
                }
            });
        } else {
            channel.send('**❌ Unsuccessful authentication, please retry**');
            fs.writeFileSync(`./guilds/${guild.id}/config.json`, JSON.stringify(defaultConfig));
        }
    });
}

function getLink(authClient) {
    const AuthUrl = authClient.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });
    let embed = {
        description: `Please authorize your account by clicking this [link](${AuthUrl}) and pasting the code in`,
        color: '7289DA'
    }
    return embed;
}

function getClient() {
    var oAuth2 = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    return oAuth2;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function tryAuth(code, authClient) {
    return new Promise( (resolve, reject) => {
        authClient.getToken(code, (err, token) => {
            if (err) {
                resolve({ status: false });
            } else {
                resolve({ status: true, token: token });
            }       
        });
    });
}

function promptCourse(authClient, channel) {
    coursesData = [];
    const classroom = google.classroom({ version: 'v1', auth: authClient });
    classroom.courses.list({pageSize: 0 }, (err, res) => {
        if (err) console.log(err);
        const courses = res.data.courses;
        if (courses.length > 0) {
            courses.forEach(course => {
                coursesData.push( {name: course.name, id: course.id });
            });
            channel.send('Please select a course to bind to:');
            embedify(coursesData, channel);
        }
    });
}

function embedify(courseData, channel) {
    var descText = "";
    courseData.forEach(data => {
        descText += `Name: **${data.name}** \nID: **${data.id}**\n\n`;
    });
    let returnEmbed = {
        color: '7289DA',
        title: 'Google Classroom Courses:',
        description: descText
    };
    channel.send({ embed: returnEmbed }).then(message => {
        message.delete({ timeout: 30000 });
    });
}

module.exports = {
    async execute(guild, channel) {
        check(guild).then(() => {
            createGuild(guild, channel);
        });
    }
}