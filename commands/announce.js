const fs = require('fs');
const authenticate = require('../authenticate.js');
var classroom;

async function getAnnouncement(guild, channel) {
    const { courseName, courseID, userToken } = JSON.parse(fs.readFileSync(`./guilds/${guild.id}/config.json`));
    await getAuth(userToken);
    classroom.courses.announcements.list({ courseId: courseID, pageSize: 1 }, (err, res) => {
        if (err) console.log(err);
        let announcement = res.data.announcements[0];
        let announcementTime = announcement.creationTime;
        let announcementText = announcement.text;
        let announcementMaterials = announcement.materials
        embedify(channel, announcementTime, announcementText, courseName, materials(announcementMaterials));
    });
}

function getAuth(userToken) {
    return new Promise((resolve, reject) => {
        classroom = authenticate.execute(userToken);
        resolve()
    });
}

function embedify(channel, time, text, name, materials) {
    let announcementEmbed = {
        color: '7289DA',
        description: `__**Text Found:**__\n\n ${text}` + materials,
        author: {
            name: "Google Classroom v1",
        },
        title: name,
        timestamp: time
    }
    channel.send({ content: "**New Announcement Found**", embed: announcementEmbed }).catch(console.error);
}

function materials(materials) {
	var descAdd = "\n __**Attachments:**__\n"
	if (materials === undefined) {
		return descAdd = "";
	}
	materials.forEach(m => {
		if (m.link) {
			descAdd += `| [${m.link.title}](${m.link.url}) | \n`;
		} else if (m.driveFile) {
			descAdd += `| [${m.driveFile.driveFile.title}](${m.driveFile.driveFile.alternateLink}) | \n`;
		} else if (m.form) {
			descAdd += `| [${m.form.title}](${m.form.formUrl}) | \n`;
		} else if (m.youtubeVideo) {
			descAdd += `| [${m.youtubeVideo.title}](${m.youtubeVideo.alternateLink}) | \n`;
		}
	});
	return descAdd;
}


module.exports = {
    name: 'announce',
    execute(guild, channel, args) {
        getAnnouncement(guild, channel);
    }
}