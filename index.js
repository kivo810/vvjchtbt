const BootBot = require('bootbot');
const config = require('config');
const fetch = require('node-fetch')

var port = process.env.PORT || config.get('PORT');

// const MOVIE_API = "http://www.omdbapi.com/?apikey=8df4f6a8"
// const WEATHER_API = "http://api.openweathermap.org/data/2.5/"
// const API_KEY = "&appid=8bebd0d8a0a3c015779632cb35e71641"

const SEARCH_TEAM_API = "https://www.thesportsdb.com/api/v1/json/1/searchteams.php?"

// const UNITS = "&units=metric"

const bot = new BootBot({
  accessToken: config.get('ACCESS_TOKEN'),
  verifyToken: config.get('VERIFY_TOKEN'),
  appSecret: config.get('APP_SECRET')
});

bot.on('message', (payload, chat) => {
	const text = payload.message.text;
	console.log(`The user said: ${text}`);
});

bot.hear(['hi', 'hello'], (payload, chat) => {
  chat.say('Hi! If you would like to know details about football team, type name of football team in style team *name*', {typing: true})
});


bot.hear(/team (.*)/i, (payload, chat, data) => {
  chat.conversation((conversation) => {
    const team = data.match[1];
    console.log("Somebody asked about team " + team);
    fetch(SEARCH_TEAM_API + 't=' + team)
        .then(res => res.json())
        .then(json => {
          if (json.teams == null){
            conversation.say("Could not find team with this name.", {typing:true});
            conversation.end();
          } else {
            conversation.say('Found team ' + json.teams[0].strTeam, {typing:true});
            setTimeout(() => {
              conversation.say("Team was formed in "+json.teams[0].intFormedYear +" and its facebook site is " + json.teams[0].strFacebook, {typing: true});
              handleMoreDetails(conversation, json);
            }, 1000)
          }
        })
  })
})


function handleMoreDetails(conversation, json) {
  setTimeout(() => {
    conversation.ask({
      text: "Would you like to know what league and cups does this team play?",
      quickReplies: ["Yes", "No"],
      options: {typing: true}
    }, (payload, conversation) => {
      if (payload.message.text === "Yes") {
        conversation.say(json.teams[0].strLeague, {typing:true});
        if (json.teams[0].strLeague2 !== null){
          conversation.say(json.teams[0].strLeague2, {typing:true});
        }
        handleStadiumDetails(conversation, json);
      } else {
        conversation.say("Ok, ask me about a different team then.", {typing: true});
        conversation.end();
      }
    });
  }, 2000)
}

function handleStadiumDetails(conversation, json) {
  //console.log("im here")
  setTimeout(() => {
    conversation.ask({
      text: "Would you like to know about stadium of this team??",
      quickReplies: ["Yes", "No"],
      options: {typing: true}
    }, (payload, conversation) => {
      if (payload.message.text === "Yes") {
        conversation.say("Stadium is located in city " + json.teams[0].strStadiumLocation + " and have capacity of " + json.teams[0].intStadiumCapacity + " seats.", {typing:true});
        conversation.say(json.teams[0].strStadiumDescription, {typing:true});
        conversation.end();
      } else {
        conversation.say("Ok. Bye.", {typing: true});
        conversation.end();
      }
    });
  }, 2000)
}


bot.start(port);