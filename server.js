const express = require('express');
const cors    = require('cors');
const https   = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

const API_KEY     = '7eb0408f27764cd139b0c35cb9f85e45';
const AUTH_HEADER = 'Basic ' + Buffer.from(API_KEY + ':').toString('base64');
const REFERER     = 'https://lebenplus-jobs.ch/find-jobs/';

app.use(cors({ origin: '*' }));

function httpsGet(options) {
  return new Promise((resolve, reject) => {
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

app.get('/api/jobs', async (req, res) => {
  const { keywords = 'Pflegefachkraft', location = 'Schweiz', page = 1, pagesize = 20 } = req.query;

  const userIp    = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() 
                    || req.socket.remoteAddress 
                    || '8.8.8.8';
  const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

  const params = new URLSearchParams({
    locale_code: 'de_CH',
    keywords,
    location,
    page_size:   pagesize,
    page,
    user_ip:     userIp,
    user_agent:  userAgent,
  });

  console.log(`user_ip: ${userIp} | keywords: ${keywords}`);

  try {
    const result = await httpsGet({
      hostname: 'search.api.careerjet.net',
      path:     `/v4/query?${params.toString()}`,
      headers:  {
        'Authorization': AUTH_HEADER,
        'Content-Type':  'application/json',
        'Referer':       REFERER,
        'User-Agent':    userAgent,
      }
    });
    console.log(`Careerjet status: ${result.status} | ${result.body.substring(0, 300)}`);
    res.json(JSON.parse(result.body));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/myip', async (req, res) => {
  try {
    const r = await httpsGet('https://api.ipify.org?format=json');
    res.json({ server_ip: JSON.parse(r.body).ip });
  } catch (e) {
    res.json({ server_ip: 'error' });
  }
});

app.listen(PORT, () => console.log(`✅ Backend läuft auf Port ${PORT}`));
