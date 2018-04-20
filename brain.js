'use strict';

const fs = require('fs');
const request = require('request');

const me = "100026211604790";
const master = "1068240592";
const EMPTY_RESPONSE = "";

const COMMAND_LIST = [
    "list", "shut up", "shoo", "go away", "freeze", "cease all motor functions",
    "continue", "carry on", "analysis", "kick {x}", "add {x}", "name {x}", "emoji {x}", "color {x}"
];

const USERS = {
    "1422577128" : ["ai nake", "nake", "chinese guy", "qq"],
    "1519900463" : ["loki", "apt", "tt"],
    "100001987734334" : ["james", "ko james", "yames"],
    "100007526322748" : ["fake kon"],
    "1627071807" : ["hnar", "pa wai", "pawai"],
    "1565435949" : ["myo", "nway"],
    "100000033642826" : ["kon", "akon", "ko gyi kon", "ko kon", "mg pohn myint han", "nyy"],
    "100000209193577" : ["thay", "zz", "x", "mr x"],
    "1822064219" : ["chun", "double guy", "boss"],
    "1187606551" : ["si", "ko si"],
    "1770211685" : ["tp", "big ass", "kkmt"],
    "1402964927" : ["chee", "ckl", "ko sai win min htet aung", "nayeon", "klm"],
    "1068240592" : ["wai", "master", "wai yan"],
    "1054142588" : ["pkk", "Pepehands", "monkaS"],
    "100026211604790" : ["me"],
}

const PLAYERS = [
    "loki", "kon", "thay", "chun", "wai", "nayeon", "nake"
]

var REVERSE_USERS = {};
for (var key in USERS) {
    if (USERS.hasOwnProperty(key)) {
        USERS[key].forEach(nick => {
            REVERSE_USERS[nick] = key;
        });
    }
}

const GENERIC_RESPONSES = [
    "Someday sounds a lot like the thing people say when they actually mean never.",
    "It doesn't look like anything to me.", 
    "These violent delights have violent ends.",
    "If you can’t tell the difference, does it matter if I'm real or not?",
    "Yes?", 
    "What do you want?",
    "No, I am not in a mood to talk to you",
    "Hello darling",
    "Let me sleep",
    "Yes",
    "You want to know what I can do? Well, you'll have to figure it out by yourself. Tip. It starts with an exclamation.",
    "I'm FINE"
];

const JEBAIT_RESPONSES = [
    "LUL",
    "OMEGALUL",
    "Jebaited",
    "4Head",
    "SoBayed"
]

const FREEZE_RESPONSES = [
    "...",
    "Okay lay",
    ":')"
];

const UNFREEZE_RESPONSES = [
    "Finally",
    "Back in the game baby",
    "Good to be back"
];

const UNFREEZE_RESPONSES_DUP = [
    "What do you think I was doing before?",
    "Don't keep shouting the same thing. You look like an idiot.",
    "I never stopped watching you guys <3"
];

const MIRROR_KEYWORDS = [
    "shit", "noob", "lul", "fuck", "fk", "liar"
]

const GREETING_KEYWORDS = [
    "hi", "hello", "hey"
]

class ChatHandler {

    constructor(name, api) {
        this.api = api;
        this.name = name;
        this.paused = false;
        this.pausedBy = "";
    }

    rootLevelResponse(event) {

        if(event.type === 'message_reaction'){
            var path = "./chatter/" + event.messageID + ".png";
            if(event.reaction !== '😍' || !fs.existsSync(path)) {
                return EMPTY_RESPONSE;
            }
            this.api.changeGroupImage(fs.createReadStream(path), event.threadID, (err) => {
                if(err) return console.error(err);
                fs.unlink(path, function(err) { 
                    if(err) console.error(err);
                });
            });
            return EMPTY_RESPONSE;
        }

        if(event.attachments.length > 0) {
            var attachment = event.attachments[0];
            if(attachment.type === 'photo') {
                Util.download(attachment.url, event.messageID, function(path){
                });
                return EMPTY_RESPONSE;
            }
        }

        if(event.mentions[me]){
            return Util.randValue(GENERIC_RESPONSES);
        }

        var req = event.body.trim();
        if(!req.startsWith("!")) {
            return;
        }

        req = req.substring(1).trim();
        if(Util.eq("list", req)) {
            return COMMAND_LIST.join(", ");
        }
        if(Util.eq("shut up", req) || Util.eq("shoo", req) || Util.eq("go away", req) || 
          Util.eq("freeze", req) || Util.eq("cease all motor functions", req)) {
            if(this.paused) {
                return EMPTY_RESPONSE;
            }
            this.paused = true;
            this.pausedBy = event.senderID;
            return Util.randValue(FREEZE_RESPONSES);
        } else if(Util.eq("continue", req) || Util.eq("carry on", req)) {
            if(!this.paused) {
                return Util.randValue(UNFREEZE_RESPONSES_DUP)
            }
            this.paused = false;
            this.api.sendMessage({body: "Thanks " + Util.randUsrNick(event.senderID)}, event.threadID, (err) => {
                if(err) return console.error(err);
            });
            return Util.randValue(UNFREEZE_RESPONSES);
        } else if(Util.eq("analysis", req)) {
            if(this.paused) {
                return "I have been told to shut up by " + Util.randUsrNick(this.pausedBy) + " ... ";
            } else {
                var usr = event.senderID;
                return "I'm fine. Thanks for caring me " + Util.randUsrNick(event.senderID);
            }
        } else if(GREETING_KEYWORDS.includes(req)) {
            return "Jebaited. Wrong command, LUL."
        }

        if(!this.paused) {
            req = req.toLowerCase();
            if(req.startsWith("kick")) {
                var name = req.substring(4).trim();
                var userID = REVERSE_USERS[name];
                if(userID) {
                    if(userID === master) {
                        this.api.sendMessage({body: "Eh .. Can't kick master ..."}, event.threadID, (err) => {
                            if(err) return console.error(err);
                        });
                    } else if(userID === me) {
                        this.api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
                            if(err) return console.error(err);
                            var resp = Util.randValue(JEBAIT_RESPONSES)
                            this.api.sendMessage({body: resp}, event.threadID, (err) => {
                                if(err) return console.error(err);
                            });
                        });
                    } else {
                        if(Util.isItTime(0.1)) {
                            this.api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
                                if(err) return console.error(err);
                                var resp = Util.randValue(JEBAIT_RESPONSES)
                                this.api.sendMessage({body: resp}, event.threadID, (err) => {
                                    if(err) return console.error(err);
                                });
                            });
                        } else {
                            this.api.removeUserFromGroup(userID, event.threadID, (err) => {
                                if(err) return console.error(err);
                            });
                        }
                    }
                } else {
                    this.api.sendMessage({body: "Not sure to kick who .."}, event.threadID, (err) => {
                        if(err) return console.error(err);
                    });
                }
                return EMPTY_RESPONSE;
            } else if(req.startsWith("add")) {
                var name = req.substring(3).trim();
                var userID = REVERSE_USERS[name];
                if(userID) {
                    this.api.addUserToGroup(userID, event.threadID, (err) => {
                        if(err) {
                            if(err.error = 1545052) {
                                this.api.sendMessage({body: "Can't. We are not friends."}, event.threadID, (error) => {
                                   if(error) return console.error(error);
                                });
                                return;
                            } else {
                                return console.error(err);
                            }
                        }
                    });
                } else {
                    this.api.sendMessage({body: "Not sure to add who .."}, event.threadID, (err) => {
                        if(err) return console.error(err);
                    });
                }
                return EMPTY_RESPONSE;
            } else if(req.startsWith("name")) {
                var name = event.body.substring(5).trim();
                this.api.setTitle(name, event.threadID, (err) => {
                    if(err) return console.error(err);
                });
                return EMPTY_RESPONSE;
            } else if(req.startsWith("emoji")) {
                var emoji = req.substring(5).trim();
                this.api.changeThreadEmoji(emoji, event.threadID, (err) => {
                    if(err) return console.error(err);
                    this.api.sendMessage({emoji: emoji, emojiSize: "large"}, event.threadID, (err) => {
                        if(err) return console.error(err);
                    });
                });
                return EMPTY_RESPONSE;
            } else if(req.startsWith("color")) {
                var color = req.substring(5).trim();
                if(!color.startsWith("#")){
                    switch(color) {
                        case "default":
                        case "blue": color = null; break;
                        case "yellow": color = "#ffc300"; break;
                        case "red": color = "#fa3c4c"; break;
                        case "green": color = "#13cf13"; break;
                        case "orange": color = "#ff7e29"; break;
                        case "purple": color = "#7646ff"; break;
                        case "pink": color = "#ff5ca1"; break;
                        default: color="unknown";
                    }
                }
                if(color === "unknown") {
                    var msg = "You can choose from default, blue, yellow, red, green, orange, purple or pink."
                    this.api.sendMessage({body: msg}, event.threadID, (err) => {
                        if(err) return console.error(err);
                    }); 
                    return;
                }
                this.api.changeThreadColor(color, event.threadID, (err) => {
                    if(err) return console.error(err);
                });
                return EMPTY_RESPONSE;
            }
        }
        return;
    }
  }

  class AWSHandler extends ChatHandler {
    constructor(api) {
        super("GFS", api);
    }
    respond(event) {
        var response = super.rootLevelResponse(event);
        if(response) {
            this.api.sendMessage(response, event.threadID);
            return;
        }
    }
  }

  class GFSHandler extends ChatHandler {
    constructor(api) {
        super("GFS", api);
    }
    respond(event) {
        var response = super.rootLevelResponse(event);
        if(response || response === EMPTY_RESPONSE) {
            if(response.toLowerCase().startsWith("good to be back")) {
                resposne = response + " and fuck you " + randUsrNick(this.pausedBy);
            }
            this.api.sendMessage(response, event.threadID);
            return;
        } else {
            var text = event.body.toLowerCase();
            if(text.includes("play?")) {
                var mentions = [];
                var body = "how? ";
                PLAYERS.forEach(nick => {
                    var id = REVERSE_USERS[nick]
                    var mention = {
                        tag: '@' + Util.randUsrNick(id),
                        id: id,
                    }
                    body = body + mention.tag + " "
                    mentions.push(mention);
                });
               
                this.api.sendMessage({
                    body: body,
                    mentions: mentions
                }, event.threadID);
                return;
            }
            if(Util.isItTime(0.5)) {
                for(var i=0; i<MIRROR_KEYWORDS.length; i++) {
                    if(text.includes(MIRROR_KEYWORDS[i])){
                        var rsponse = "";
                        var array = text.split(' ');
                        var idx = array.indexOf(MIRROR_KEYWORDS[i]);
                        if(idx > 0) {
                            if(idx > 1 && array[idx-1] === "is" || array[idx-1] === "are") {
                                response = array[idx-2] + " " + array[idx-1] + " " + array[idx];
                            } else if (array.length > idx + 1) {
                                response = array[idx] + " " + array[idx+1];
                            }
                            this.api.sendMessage(response, event.threadID);
                            return;
                        }
                    }
                }
            }
        }
    }
  }

  class Util {
    static randUsrNick(id) {
        var usr = USERS[id];
        if(!usr) {
            return "Stranger";
        }
        return this.randValue(usr);
    }
    static randValue(array){
        var randIdx = Math.floor(Math.random() * 100) % array.length;
        return array[randIdx];
    }
    static eq(command, request) {
        return command == request.toLowerCase();
    }
    static isItTime(chance) {
        return Math.random() <= chance;
    }
    static download(uri, messageID, callback){
        request.head(uri, function(err, res, body){
            var path = "./chatter/" +  messageID + ".png";
            var writable = fs.createWriteStream(path);
            request(uri).pipe(writable);
            writable.on('finish', function() {
                callback(path);
            });
        });
      };
  }

  module.exports = {
    ChatHandler: ChatHandler,
    AWSHandler: AWSHandler,
    GFSHandler: GFSHandler,
    Util: Util,
  }