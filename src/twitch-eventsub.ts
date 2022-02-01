import { Express } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { config } from './config';

const TWITCH_MESSAGE_ID = 'Twitch-Eventsub-Message-Id'.toLowerCase();
const TWITCH_MESSAGE_TIMESTAMP = 'Twitch-Eventsub-Message-Timestamp'.toLowerCase();
const TWITCH_MESSAGE_SIGNATURE = 'Twitch-Eventsub-Message-Signature'.toLowerCase();
const MESSAGE_TYPE = 'Twitch-Eventsub-Message-Type'.toLowerCase();

const MESSAGE_TYPE_VERIFICATION = 'webhook_callback_verification';
const MESSAGE_TYPE_NOTIFICATION = 'notification';
const MESSAGE_TYPE_REVOCATION = 'revocation';

const HMAC_PREFIX = 'sha256=';

// TODO: types for event
export function twitchEventsub(app: Express, handler: (event: any) => void) {
  app.post('/eventsub', (req, res) => {
    let secret = getSecret();
    let message = getHmacMessage(req);
    let hmac = HMAC_PREFIX + getHmac(secret, message);

    if (verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {
      console.log('signatures match');
      console.log('Header', req.headers[MESSAGE_TYPE]);

      let notification = JSON.parse(req.body);

      if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
        console.log(`Event type: ${notification.subscription.type}`);
        console.log(JSON.stringify(notification.event, null, 2));
        handler(notification.event);

        res.sendStatus(204);
      } else if (MESSAGE_TYPE_VERIFICATION === req.headers[MESSAGE_TYPE]) {
        console.log(notification.challenge);
        res.status(200).send(notification.challenge);
      } else if (MESSAGE_TYPE_REVOCATION === req.headers[MESSAGE_TYPE]) {
        res.sendStatus(204);

        console.log(`${notification.subscription.type} notifications revoked!`);
        console.log(`reason: ${notification.subscription.status}`);
        console.log(`condition: ${JSON.stringify(notification.subscription.condition, null, 2)}`);
      } else {
        res.sendStatus(204);
        console.log(`Unknown message type: ${req.headers[MESSAGE_TYPE]}`);
      }
    } else {
      console.log('403');
      res.sendStatus(403);
    }
  });
}

function getSecret() {
  return config.eventsub_secret;
}

function getHmacMessage(request) {
  return (request.headers[TWITCH_MESSAGE_ID] +
    request.headers[TWITCH_MESSAGE_TIMESTAMP] +
    request.body);
}

function getHmac(secret, message) {
  return createHmac('sha256', secret)
    .update(message)
    .digest('hex');
}

function verifyMessage(hmac, verifySignature) {
  return timingSafeEqual(Buffer.from(hmac), Buffer.from(verifySignature));
}
