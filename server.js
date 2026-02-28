const express = require('express');
const cors    = require('cors');
const https   = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

// Allow requests from your Netlify domain
app.use(cors({
  origin: [
    'https://lebenplus-jobs.ch',
    'https://www.lebenplus-jobs.ch',
    'http://localhost:3000'
  ]
}));

// ── Careerjet API Proxy ──────────────────────────────────────────────────────
app.get('/api/jobs', (req, res) => {
  const {
    keywords = 'Jobs',
    location = 'Deutschland',
    page     = 1,
    pagesize = 15,
  } = req.query;

  const params = new URLSearchParams({
    affid:       '7eb0408f27764cd139b0c35cb9f85e45',
    locale_code: 'de_DE',
    keywords,
    location,
    pagesize,
    page,
  });

  const apiUrl = `https://public.api.careerjet.net/search?${params.toString()}`;

  https.get(apiUrl, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        res.json(json);
      } catch (e) {
        res.status(500).json({ error: 'Ungültige API-Antwort' });
      }
    });
  }).on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
});

// ── IP-Check Endpunkt (zum Herausfinden der Server-IP für Careerjet) ─────────
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
