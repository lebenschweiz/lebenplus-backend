const express = require('express');
const cors    = require('cors');
const https   = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

// v4 API Key (aus der Doku-URL)
const API_KEY = '7c363d8713061134c7bb031b35c29a5c';
const AUTH_HEADER = 'Basic ' + Buffer.from(API_KEY + ':').toString('base64');

app.use(cors({
  origin: '*'
}));

app.get('/api/jobs', (req, res) => {
  const {
    keywords  = 'Pflegefachkraft',
    location  = 'Schweiz',
    page      = 1,
    pagesize  = 20,
  } = req.query;

  const params = new URLSearchParams({
    locale_code: 'de_CH',
    keywords,
    location,
    page_size:   pagesize,
    page,
    user_ip:     '1.1.1.1',
    user_agent:  'Mozilla/5.0',
  });

  const options = {
    hostname: 'search.api.careerjet.net',
    path:     `/v4/query?${params.toString()}`,
    method:   'GET',
    headers:  {
      'Authorization': AUTH_HEADER,
      'User-Agent':    'Mozilla/5.0',
    }
  };

  console.log(`Calling: https://search.api.careerjet.net/v4/query?${params.toString()}`);

  https.get(options, (apiRes) => {
    let data = '';
    console.log(`Careerjet HTTP Status: ${apiRes.statusCode}`);
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      console.log(`Careerjet Response: ${data.substring(0, 200)}`);
      try {
        const json = JSON.parse(data);
        res.json(json);
      } catch (e) {
        res.status(500).json({ error: 'Ungültige API-Antwort', raw: data });
      }
    });
  }).on('error', (err) => {
    console.error(`Connection error: ${err.message}`);
    res.status(500).json({ error: err.message });
  });
});

app.get('/api/myip', (req, res) => {
  https.get('https://ifconfig.me/ip', (r) => {
    let ip = '';
    r.on('data', d => ip += d);
    r.on('end', () => res.json({ server_ip: ip.trim() }));
  }).on('error', () => res.json({ server_ip: 'Nicht ermittelbar' }));
});

app.listen(PORT, () => {
  console.log(`✅ Lebenplus Backend läuft auf Port ${PORT}`);
});
