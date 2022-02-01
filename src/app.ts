import express from 'express';
import { twitchEventsub } from './twitch-eventsub';

const app = express();
const port = 8080;

app.use(express.raw({ type: 'application/json' }));

twitchEventsub(app, (event) => console.log('event', event));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
