'use strict';

// Imports dependencies and set up http server
const 
  PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN,
  path = require('path'),
  request = require('request'),
  express = require('express'),
  frameguard = require('frameguard'),
  body_parser = require('body-parser'),
  app = express()
    .use(body_parser.json())
    .use(express.static(path.join(__dirname, 'topkek')))
    .use(frameguard({
        action: 'allow-from',
        domain: 'https://www.messenger.com'
    }))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/privacy', (req, res) => res.render('pages/privacy-policy'))
  .get('/', (req, res, next) => {
    if(req.query.site && req.query.site.toLowerCase() === "gfsrocks") {
      return res.render('pages/index', {'site': "gfsrocks"})
    } else {
      return res.render('pages/index', {'site': "na"})
    }
})

require("./chatter")

// Sets server port and logs message on success
app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

        // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        console.log('Sender PSID: ' + sender_psid);

        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhook_event.message) {
            handleMessage(sender_psid, webhook_event.message);        
        } else if (webhook_event.postback) {
            handlePostback(sender_psid, webhook_event.postback);
        }
  
      
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  } else {
    res.sendStatus(400);     
  }
});


// Handles messages events
function handleMessage(sender_psid, received_message) {
    let response;

    // Check if the message contains text
    if (received_message.text) {    
  
      // Create the payload for a basic text message
      response = {
        "text": 'I hear ya. Usually it takes a while for Messenger to show the new extension but you should be able to see it within an hour.'
      }
    }  else if (received_message.attachments) {
        // Get the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
          "attachment": {
            "type": "template",
            "payload": {
              "template_type": "generic",
              "elements": [{
                "title": "What do you want me to do with this?",
                "subtitle": "Tap a button to answer.",
                "image_url": attachment_url,
                "buttons": [
                  {
                    "type": "postback",
                    "title": "Keep it!",
                    "payload": "yes",
                  },
                  {
                    "type": "postback",
                    "title": "Delete it!",
                    "payload": "no",
                  },
                  {
                    "type":"web_url",
                    "url":"https://waibot.herokuapp.com",
                    "title":"Kappa",
                    "webview_height_ratio": "compact",
                    "messenger_extensions": "true"
                  }
                ],
              }]
            }
          }
        }
    }
    
    // Sends the response message
    callSendAPI(sender_psid, response);  
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;
  
    // Get the payload for the postback
    let payload = received_postback.payload;
  
    // Set the response based on the postback payload
    if (payload === 'yes') {
      response = { "text": "Gotcha!" }
    } else if (payload === 'no') {
      response = { "text": "Didn't see anything ~~" }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
          "id": sender_psid
        },
        "message": response
      }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
                "method": "POST",
                "json": request_body
        }, (err, res, body) => {
            if (!err) {
                console.log('message sent!')
            } else {
                console.error("Unable to send message:" + err);
            }
    }); 
}