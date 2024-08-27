const { google } = require('googleapis');
const { OAuth2 } = google.auth;

const oauth2Client = new OAuth2(
  process.env.GOOGLE_MEET_CLIENT_ID,
  process.env.GOOGLE_MEET_CLIENT_SECRET,
  process.env.GOOGLE_MEET_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: '1//03I8v5pMA_3A7CgYIARAAGAMSNwF-L9IrWUDIFVIoFjzbq0heCtS4IaR1aamtvNht_Uj6FmvUEMLzqgoLYL-JtBL0WypeLe0xWow',
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

module.exports = calendar;
