const BootBot = require('bootbot');
const config = require('config');
const fetch = require('node-fetch')

var port = process.env.PORT || config.get('PORT');

const MOVIE_API = "http://www.omdbapi.com/?apikey=8df4f6a8"

const bot = new BootBot({
  accessToken: config.get('ACCESS_TOKEN'),
  verifyToken: config.get('VERIFY_TOKEN'),
  appSecret: config.get('APP_SECRET')
});

bot.on('message', (payload, chat) => {
	const text = payload.message.text;
	console.log(`The user said: ${text}`);
});

bot.hear(['hello', 'hi'], (payload, chat) => {
	chat.say('Hi! Movie?')
});

bot.start(port);