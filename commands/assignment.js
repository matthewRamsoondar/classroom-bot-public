const fs = require('fs');
const authenticate = require('../authenticate.js');
var classroom;

async function getAssignment(guild, channel) {
    const { courseName, courseID, userToken } = JSON.parse(fs.readFileSync(`./guilds/${guild.id}/config.json`));
    await getAuth(userToken);
    classroom.courses.courseWork.list({ courseId: courseID, pageSize: 1 }, (err, res) => {
        if (err) console.log(err);
        let assignment = res.data.courseWork[0];
        let assignmentTime = assignment.creationTime;
        let assignmentText = assignment.description;
        let assignmentMaterials = assignment.materials
        let assignmentTitle = assignment.title;
        let assignmentLink = assignment.alternateLink;
        embedify(channel, assignmentTime, assignmentText, courseName ,assignmentTitle, assignmentLink, materials(assignmentMaterials));
    });
}

function getAuth(userToken) {
    return new Promise((resolve, reject) => {
        classroom = authenticate.execute(userToken);
        resolve()
    });
}

function embedify(channel, time, text, name, title, link, materials) {
    let assignmentEmbed = {
        color: '7289DA',
        author: {
            name: "Google Classroom v1",
        },
        title: `${name} - ${title}`,
        url: link,
        description: `**Course Work**\n__**Text Found:**__\n\n${text}\n` + materials,
        timestamp: time
    }
    channel.send({ content: "**New Assingment Found**", embed: assignmentEmbed });
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
    name: 'assignment',
    execute(guild, channel, args) {
        getAssignment(guild, channel);
    }
}