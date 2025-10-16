const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// ----- API ROUTES -----
app.get('/api/banks', (req, res) => {
  res.json({
    banks: [
      { id: 'partner-bank', name: 'Partner Bank' },
      { id: 'mastercard-bank', name: 'Mastercard Bank' },
      { id: 'first-financial', name: 'First Financial' },
      { id: 'peoples-credit', name: 'Peoples Credit' },
    ],
  });
});

let recentEvents = [];

app.post('/api/connect', (req, res) => {
  const { bankId } = req.body;

  // Simulate a 500 error for Partner Bank
  if (bankId === 'partner-bank') {
    const errorEvent = { type: 'API 500', msg: 'Partner Bank connection failed', time: new Date().toISOString() };
    recentEvents.unshift(errorEvent);
    if (recentEvents.length > 10) recentEvents.pop();
    return res.status(500).json({ message: 'Internal server error: Partner Bank connection failed' });
  }

  // Successful connection
  const successEvent = { type: 'connection', outcome: 'success', bankId, time: new Date().toISOString() };
  recentEvents.unshift(successEvent);
  if (recentEvents.length > 10) recentEvents.pop();

  res.json({
    account: {
      institution: bankId,
      mask: '****1234',
    },
  });
});

app.get('/api/events/recent', (req, res) => {
  res.json({ events: recentEvents });
});

// ----- SERVE FRONTEND -----
const clientBuildPath = path.join(__dirname, 'client-build');

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  console.error('⚠️ client-build folder not found. Make sure to run npm run build in /client');
}

// ----- START SERVER -----
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

