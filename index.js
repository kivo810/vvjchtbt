const BootBot = require('bootbot');
const config = require('config');
const fetch = require('node-fetch');

var port = process.env.PORT || config.get('PORT');

// const SEARCH_TEAM_API = "https://www.thesportsdb.com/api/v1/json/1/searchteams.php?"
// const NEXT_5FIX_API = "https://www.thesportsdb.com/api/v1/json/1/eventsnext.php?id="
// const LAST5RESULTS_API = "https://www.thesportsdb.com/api/v1/json/1/eventslast.php?id="

const SPORTDB_API = "https://www.thesportsdb.com/api/v1/json/1/";


const bot = new BootBot({
  accessToken: config.get('ACCESS_TOKEN'),
  verifyToken: config.get('VERIFY_TOKEN'),
  appSecret: config.get('APP_SECRET')
});

bot.on('message', (payload, chat) => {
	const text = payload.message.text;
	console.log(`The user said: ${text}`);
});

bot.hear(['hi', 'hello', "ahoj", "cau"], (payload, chat) => {
  chat.say({
    attachment: 'image',
    url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/facebook/230/waving-hand-sign_1f44b.png',
  });
  setTimeout(() => {
    chat.say('Hi! If you would like to know details about football team, type name of football team in style team *name*', {typing: true});
  },4000 )
});



bot.hear(/team (.*)/i, (payload, chat, data) => {
  chat.conversation((conversation) => {
    const team = data.match[1];
    console.log("Somebody asked about team " + team);
    fetch(SPORTDB_API + 'searchteams.php?t=' + team)
        .then(res => res.json())
        .then(json => {
          if (json.teams == null){
            conversation.say("Could not find team with this name.", {typing:true});
            conversation.end();
          } else {
            conversation.say('Found team ' + json.teams[0].strTeam, {typing:true});
            setTimeout(() => {
              conversation.say("Team was formed in "+json.teams[0].intFormedYear +" and its facebook site is " + json.teams[0].strFacebook, {typing: true})
              askWhatNext(conversation, json);
              //handleMoreDetails(conversation, json);
            }, 1000)
          }
        })
  })
})


function askWhatNext(conversation, json) {
  setTimeout(() => {
    conversation.ask({
      text: "What would you like to see?",
      quickReplies: ["More details", "Next 5 fixtures", "Last 5 results" ,"Other team"],
      options: {typing: true}
    }, (payload, conversation) => {
      if (payload.message.text === "More details") {
        handleMoreDetails(conversation, json);
      } else if (payload.message.text === "Next 5 fixtures") {
        handleNext5Fixtures(conversation, json);
      } else if (payload.message.text === "Last 5 results") {
        handleLast5Results(conversation, json);
      } else {
        conversation.say("Ok, ask me about a different team then.", {typing: true});
        conversation.end();
      }
    });
  }, 2000)
}

function handleNext5Fixtures(conversation, json) {
  const teamId = json.teams[0].idTeam;
  fetch(SPORTDB_API + "eventsnext.php?id=" + teamId)
      .then(res => res.json())
      .then(fixturesJSON => {
        //console.log(fixturesJSON);
        let events = fixturesJSON.events;
        //console.log(events);
        //console.log("-------------");
        //console.log(events[0]);
        var message = "";

        for (fixture of events){
          //console.log(fixture.strEvent);
          message += fixture.dateEvent + "\n" + fixture.strTime + "\n" + fixture.strEvent + "\n\n";
        }
        conversation.say(message);
        conversation.end();
      })
}

function handleLast5Results(conversation, json) {
  const teamId = json.teams[0].idTeam;
  fetch(SPORTDB_API + "eventslast.php?id=" + teamId)
      .then(res => res.json())
      .then(resultsJSON => {
        //console.log(fixturesJSON);
        let resultList = resultsJSON.results;
        //console.log(events);
        //console.log("-------------");
        //console.log(events[0]);
        var message = "";
        console.log(resultList)
        for (result of resultList){
          //console.log(fixture.strEvent);
          console.log(result);
          message += result.strHomeTeam + " " + result.intHomeScore + "-" + result.intAwayScore + " " + result.strAwayTeam;
          if (result.strVideo !== null){
            message += "\n" + "Highlights: " + result.strVideo ;
            message += "\n";
          }
          message += "\n";
        }
        conversation.say(message);
        conversation.end();
      })
}

function handleMoreDetails(conversation, json) {

  var message = "";
  message += json.teams[0].strLeague;
  message += " ";
  if (json.teams[0].strLeague2 !== null){
    message += json.teams[0].strLeague2;
  }
  conversation.say("This team plays in these leagues and cups: " + message);
  handleStadiumDetails(conversation, json);
}

function handleStadiumDetails(conversation, json) {
  console.log("im here")
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