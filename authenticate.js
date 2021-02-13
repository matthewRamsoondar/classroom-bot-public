const { google } = require('googleapis');
const { installed } = require('./credentials.json');
const { client_id, client_secret, redirect_uris } = installed;

function createAuth(token) {
    var oAuth2Client = new google.auth.OAuth2(
        client_id, 
        client_secret,
        redirect_uris[0]
    );
    oAuth2Client.setCredentials(token);
    var classroom = google.classroom({ version: 'v1', auth: oAuth2Client });
    return classroom;
}


module.exports = {
    execute(token) {
        return createAuth(token);
    }
}