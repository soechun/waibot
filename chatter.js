'use strict';

const Brain = require("./brain");
const fs = require("fs");
const login = require("facebook-chat-api");

var cred = {
    //email: "@gmail.com",
    //password: "",
    appState: JSON.parse(fs.readFileSync('cred.json', 'utf8'))
}

var threads = {
    "aws": "",
    "gfs-rip": "1361209983943388",
    "gfs": "2011462288971336",
    "test": "1870426239663689"
}

var presence = {};

login(cred, (err, api) => {
    if(err) return console.error(err);
    if(!cred.appState) {
        fs.writeFileSync('cred.json', JSON.stringify(api.getAppState()));
    }
    api.setOptions({
        listenEvents: true,
        logLevel: "silent"
    });

    // Snippet to find new users by ID
    // api.getUserID("Pepega Bot", (err, data) => {
    //     if(err) console.error(err)
    //     else console.log(data)
    // });
 
    var awsHandler = new Brain.AWSHandler(api);
    var gfsHandler = new Brain.GFSHandler(api);
    var stopListening = api.listen((err, event) => {
        if(err) return console.error(err);
        if(event.type !== 'message' && event.type !== 'message_reaction') {
            return;
        }
        if(event.threadID == threads.aws) {
           awsHandler.respond(event);
        } else if(event.threadID == threads.gfs || event.threadID == threads.test) {
            gfsHandler.respond(event);
        } else {
            console.error(event);
        }
        if(event.senderID === "1068240592" && event.body === 'stop') {
            api.sendMessage("May be next time.", event.threadID);
            return stopListening();
        }
    });
});