import axios from 'axios';
import { config } from './config';

const instance = axios.create();

let exp = 0;
let token = '';

export async function getToken() {
  if (token && exp > Date.now()) {
    return token;
  } else {
    const res = await getActualToken();
    if (res.status === 200) {
      exp = Date.now() + res.data.expires_in / 2;
      token = res.data.access_token;
      return token;
    }

    console.error('getToken ERROR', res, res.data);
  }
}

async function getActualToken() {
  return instance.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      grant_type: 'client_credentials',
      client_id: config.client_id,
      client_secret: config.client_secret,
    }
  })
}

export async function getUserId(username: string) {
  return instance.get('https://api.twitch.tv/helix/users', {
    headers: {
      'Authorization': 'Bearer ' + await getToken(),
      'Client-Id': config.client_id,
    },
    params: {
      login: username,
    }
  });
}

export async function subscribe(user_id: string, type: string) {
  return instance.post('https://api.twitch.tv/helix/eventsub/subscriptions', {
    type,
    version: '1',
    condition: {
      broadcaster_user_id: user_id,
    },
    transport: {
      method: 'webhook',
      callback: config.eventsub_callback,
      secret: config.eventsub_secret,
    }
  }, {
    headers: {
      'Authorization': 'Bearer ' + await getToken(),
      'Client-Id': config.client_id,
      'Content-Type': 'application/json',
    }
  })
}
