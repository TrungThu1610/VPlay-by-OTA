export default async function handler(req, res) {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).send("Missing target url");
  }

  try {
    const response = await fetch(targetUrl, { 
      redirect: 'follow',
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0'
      }
    });
    
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Forward all headers EXCEPT standard CORS and CORP security headers
      if (!lowerKey.includes('cross-origin') && lowerKey !== 'access-control-allow-origin') {
        res.setHeader(key, value);
      }
    });

    // Inject our open CORS policy
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    // Respond to OPTIONS
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Convert Web Stream to Node response
    if (response.body) {
      const { Readable } = require('stream');
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Proxy error");
  }
}
