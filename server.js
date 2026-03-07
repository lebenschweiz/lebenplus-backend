const express = require('express');
const cors    = require('cors');
const https   = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

const API_KEY = '7eb0408f27764cd139b0c35cb9f85e45';
// Basic Auth: Base64(apikey + ":")
const AUTH_HEADER = 'Basic ' + Buffer.from(API_KEY + ':').toString('base64');

app.use(cors({
  origin: [
    'https://lebenplus-jobs.ch',
    'https://www.lebenplus-jobs.ch',
    'http://localhost:3000'
  ]
}));

app.get('/api/jobs', (req, res) => {
  const {
    keywords  = 'Jobs',
    location  = 'Schweiz',
    page      = 1,
    pagesize  = 20,
  } = req.query;

  const userIp    = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '1.1.1.1';
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

  const options = {
    hostname: 'search.api.careerjet.net',
    path:     `/v4/query?${params.toString()}`,
    method:   'GET',
    headers:  {
      'Authorization': AUTH_HEADER,
      'User-Agent':    userAgent,
    }
  };

  https.get(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        res.json(json);
      } catch (e) {
        res.status(500).json({ error: 'Ungültige API-Antwort', raw: data });
      }
    });
  }).on('error', (err) => {
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
