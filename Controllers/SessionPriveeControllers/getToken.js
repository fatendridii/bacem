const express = require('express');
const { google } = require('googleapis');
const opn = require('opn');

const app = express();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_MEET_CLIENT_ID,
  process.env.GOOGLE_MEET_CLIENT_SECRET,
  process.env.GOOGLE_MEET_REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

app.get('/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  opn(url);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  console.log('Refresh Token:', tokens.refresh_token);
  res.send('Authentication successful! You can close this tab.');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
  console.log('Visit http://localhost:3000/auth to authenticate');
});
