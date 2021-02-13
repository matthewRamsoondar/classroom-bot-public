const { Console } = require('console');
const fs = require('fs');
const authenticate = require('../authenticate.js');
var classroom;
var coursesData = [];

function selectCourse(guild, channel) {
    const config = require(`../guilds/${guild.id}/config.json`);
    let defaultConfig = {
        authReady: true,
        courseReady: false,
        courseName: undefined,
        courseID: undefined,
        streamChannelID: config.streamChannelID,
        userToken: config.userToken
    }

    promptCourse(guild, channel);
    const filter = m => m.author.id === '231907966629052416'; //remove/change
    channel.awaitMessages(filter, { max: 1, time: 30000 }).then(collected => {
        if (collected.first() != undefined) {
            var input = collected.first().content;
            if (coursesData.some(course => course.id === input)) {
                const config = require(`../guilds/${guild.id}/config.json`)
                config.courseReady = true;
                config.courseID = input;
                config.courseName = coursesData.find(course => course.id === input).name;
                fs.unlinkSync(`guilds/${guild.id}/config.json`);
                fs.writeFileSync(`guilds/${guild.id}/config.json`, JSON.stringify(config));
                const monitor = require(`../guilds/${guild.id}/monitor.js`);
                monitor.execute(guild);
                channel.send(`**✅ Successfully binded to ${input} - ${config.courseName}**`);
            } else {
                fs.writeFileSync(`guilds/${guild.id}/config.json`, JSON.stringify(defaultConfig));
                channel.send(`**❌ Unsuccessful bind to ${input}**`);
            }
        } else {
            fs.writeFileSync(`guilds/${guild.id}/config.json`, JSON.stringify(defaultConfig));
            channel.send(`**❌ Unsuccessful bind**`);
        }
    });
}
async function promptCourse(guild, channel) {
    coursesData = [];
    const { userToken } = require(`../guilds/${guild.id}/config.json`);
    await createAuth(userToken);
    classroom.courses.list({ pageSize: 0 }, (err, res) => {
        if (err) console.log(err);
        const courses = res.data.courses;
        if (courses.length > 0) {
            courses.forEach(course => {
                coursesData.push( {name: course.name, id: course.id });
            });
            channel.send('Please select a course to bind to:');
            embedify(coursesData, channel);
        } else {
            channel.send('No courses found');
        }
    });
}

function createAuth(token) {
    return new Promise((resolve, reject) => {
       classroom = authenticate.execute(token);
       resolve();
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
    name: 'courses',
    execute(guild, channel, args) {
        selectCourse(guild, channel);
    }
}