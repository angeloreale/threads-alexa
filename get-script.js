const https = require("https")

async function getReq(url) {
  return new Promise ((resolve, reject) => {
    const req = https.get(url, res => {
      let rawData = '';

      res.on('data', chunk => {
        rawData += chunk;
        clearTimeout(timeout);
      });

      res.on('end', async () => {
        try {
          resolve(JSON.parse(rawData));
          clearTimeout(timeout);
        } catch (err) {
          clearTimeout(timeout);
          reject();
        }
      });
    });

    req.on('error', err => {
      clearTimeout(timeout);
      reject();
    });
  })
}

const fn = async (url) => new Promise(async (resolve, reject) => {
    try {
      const answer = await getReq(url);
      resolve(answer);
    } catch (e) {
      reject();
    }
});

const timeout = async (url) => {
  return new Promise(async (resolve, reject) => {
    const cancel = setTimeout(async () => {
      reject();
    }, 2000);
    const answer = await fn(url)
    clearTimeout(cancel)
    resolve(answer)
  })
}

const getRequest = async (url) => new Promise(async (resolve, reject) => {
  try {
    const answer = await timeout(url);
    resolve(answer);
  } catch (e) {
    reject()
  }
})

const unescapeHTML = (safe) => {
  return safe.replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\(R\)/g, "from Repeats");
}

async function getPlaybackInfo(who = 0) {
  const publicStatus = [
    'https://threads.airtime.pro/api/live-info-v2',
    'https://threads2.airtime.pro/api/live-info-v2',
  ];

  let promises = [];
  
  const createPromise = (url) => new Promise(async (resolve, reject) => {
    try {
      const answer = await getRequest(url)
      resolve(answer)
    } catch (e) {
      resolve("Unavailable")
    }
  })

  promises.push(createPromise(publicStatus[0]));
  promises.push(createPromise(publicStatus[1]));
  
  const [response1, response2] = await Promise.allSettled(promises)

  let response = {}
    
    try {
        let show = undefined
        if (response1.value.station) {
            try { 
                show = response1.value.shows.current.name
            } catch (e) {
                show = "Nothing"
            }
            response[0] = unescapeHTML(show)
        } else {
            response[0] = "a stream that was not identified in time by Alexa."
        }
    } catch(e) {
        response[0] = "a stream that was not identified in time by Alexa."
        console.log(e)
    }
    
    try {
        let show = undefined
        if (response2.value.station) {
            try { 
                show = response2.value.shows.current.name
            } catch (e) {
                show = "Nothing"
            }
            response[1] = unescapeHTML(show)
        } else {
            response[1] = "a stream that was not identified in time by Alexa."
        }
    } catch(e) {
        response[1] = "a stream that was not identified in time by Alexa."
        console.log(e)
    }

    
    return response
}

const getThreadsData = async () => {
  const info = await getPlaybackInfo()
  console.log(info)
}

getThreadsData()