const https = require("https")

const PODCAST_URLS = ['https://threads.out.airtime.pro/threads_b', 'https://threads2.out.airtime.pro/threads2_b'];
const PUBLIC_STATUS = [
  'https://threads.airtime.pro/api/live-info-v2',
  'https://threads2.airtime.pro/api/live-info-v2',
];
const STATION_NAME = "Threads";
const CHANNELS = ["Channel One", "Channel Two"];
const WEBSITE = "threadsradio.com";
const STATION_SLUG = "threadsradio";

const MAX_WAIT = 2000;

/**
 * Kinda facade for an impatient get request.
 */
 async function getRequestWithin(url, wait) {
  return new Promise((resolve, reject) => {
    const cancel = setTimeout(async () => {
      req.destroy("TIME_OUT");
    }, wait);
    const req = https.get(url, res => {
      let rawData = '';

      res.on('data', chunk => {
        rawData += chunk;
      });

      res.on('end', async () => {
        try {
          clearTimeout(cancel);
          resolve(JSON.parse(rawData));
        } catch (err) {
          clearTimeout(cancel);
          reject();
        }
      });
    });

    req.on('error', err => {
      clearTimeout(cancel);
      reject(err);
    });
  })
}

/**
 * This is an interesting one.
 * We just need to be sure of a SLOT id. 
 * (ie. user said Channel One or maybe said Main Channel,
 * so we find and place the actual slot id, because that's constant,
 * versus the value which can be any synonym);
 */
function confirmSlot(slot) {
  return slot.resolutions.resolutionsPerAuthority.map((resolution) => {
    return resolution.status.code === 'ER_SUCCESS_MATCH' && resolution.values[0].value.id
  }).filter(el => el)[0]
}

/**
 * Airtime returns some weird PHP encoding.
 * So this helps me treat the show name to appear correctly.
 */
function unescapeHTML(safe) {
  return safe.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\(R\)/g, "from Repeats");
}

/**
 * Get the juice before the sugar.
 */
async function getPlaybackInfo(who = 0) {
  const promises = [];

  const createPromise = (url) => new Promise(async (resolve, reject) => {
    try {
      const answer = await getRequestWithin(url, MAX_WAIT);
      resolve(answer);
    } catch (e) {
      reject();
    }
  })

  promises.push(createPromise(PUBLIC_STATUS[0]));
  promises.push(createPromise(PUBLIC_STATUS[1]));

  const response = { '0': 'an unknown stream', '1': 'an unknown stream' }

  try {
    const [response1, response2] = await Promise.allSettled(promises)
    try {
      if (response1.value && response1.value.station && response1.value.shows.current.name) {
        const show = response1.value.shows.current.name;
        response[0] = unescapeHTML(show);
      } else if (response1.value && response1.value.station) {
        response[0] = "Nothing";
      } else {
        response[0] = "a stream that was not identified in time by Alexa.";
      }
    } catch (e) {
      response[0] = "a stream that was not identified in time by Alexa.";
      console.log(e);
    } 
    try {
      if (response2.value && response2.value.station && response2.value.shows.current.name) {
        const show = response2.value.shows.current.name;
        response[1] = unescapeHTML(show);
      } else if (response2.value && response2.value.station) {
        response[1] = "Nothing";
      } else {
        response[1] = "a stream that was not identified in time by Alexa.";
      }
    } catch (e) {
      response[1] = "a stream that was not identified in time by Alexa.";
      console.log(e);
    }
  } catch (e) {
    response[0] = `a stream that couldn't be figured by Alexa.`;
    response[1] = `a stream that couldn't be figured by Alexa.`;
  }


  return response
}

const getThreadsData = async () => {
  const info = await getPlaybackInfo()
  console.log(info)
}

getThreadsData()