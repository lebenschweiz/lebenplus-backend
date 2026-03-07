const express = require('express');
const cors    = require('cors');
const https   = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

const API_KEY     = '7eb0408f27764cd139b0c35cb9f85e45';
const AUTH_HEADER = 'Basic ' + Buffer.from(API_KEY + ':').toString('base64');

app.use(cors({ origin: '*' }));

// Hilfsfunktion: HTTPS GET als Promise
function httpsGet(options) {
  return new Promise((resolve, reject) => {
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

// Test-Endpoint: zeigt ausgehende IP und testet Careerjet direkt
app.get('/api/test', async (req, res) => {
  try {
    // Ausgehende IP ermitteln
    const ipRes = await httpsGet('https://api.ipify.org?format=json');
    const outgoingIp = JSON.parse(ipRes.body).ip;

    // Careerjet direkt testen
    const params = new URLSearchParams({
      locale_code: 'de_CH',
      keywords:    'Pflege',
      location:    'Schweiz',
      page_size:   5,
      page:        1,
      user_ip:     '1.1.1.1',
      user_agent:  'Mozilla/5.0',
    });

    const cjRes = await httpsGet({
      hostname: 'search.api.careerjet.net',
      path:     `/v4/query?${params.toString()}`,
      headers:  {
        'Authorization': AUTH_HEADER,
        'Content-Type':  'application/json',
        'User-Agent':    'Mozilla/5.0',
      }
    });

    res.json({
      outgoing_ip:       outgoingIp,
      careerjet_status:  cjRes.status,
      careerjet_response: JSON.parse(cjRes.body),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Haupt-Endpoint
app.get('/api/jobs', async (req, res) => {
  const { keywords = 'Pflegefachkraft', location = 'Schweiz', page = 1, pagesize = 20 } = req.query;
  const userIp    = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '1.1.1.1';
  const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

  const params = new URLSearchParams({
    locale_code: 'de_CH',
    keywords, location,
    page_size: pagesize, page,
    user_ip:    userIp,
    user_agent: userAgent,
  });

  try {
    const result = await httpsGet({
      hostname: 'search.api.careerjet.net',
      path:     `/v4/query?${params.toString()}`,
      headers:  {
        'Authorization': AUTH_HEADER,
        'Content-Type':  'application/json',
        'User-Agent':    userAgent,
      }
    });
    console.log(`Careerjet status: ${result.status}, body: ${result.body.substring(0, 200)}`);
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
