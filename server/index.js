const express = require('express');
const path = require('path');
const fs = require('fs');

// Create an Express app
const app = express();

// Support JSON request bodies
app.use(express.json());

// Port can be configured via the environment
const PORT = process.env.PORT || 8080;

// Create a directory for logs if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Helper to write a structured event to a log file.  Each event is appended
 * as a JSON line into a file named with the current date.  Events are also
 * printed to the console so they appear in Render logs.
 *
 * @param {Object} event Arbitrary event payload to record
 */
function logEvent(event) {
  const fileName = `${new Date().toISOString().slice(0, 10)}.events.log`;
  const filePath = path.join(logsDir, fileName);
  fs.appendFileSync(filePath, JSON.stringify(event) + '\n');
  console.log('EVENT:', JSON.stringify(event));
}

// Allow CORS for local development.  In production the frontend is served
// from the same origin and this header isn't strictly necessary, but it makes
// developing the client and server separately convenient.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Define a static list of banks.  Each bank can optionally specify a
// `failType` property to simulate different failure modes.  If `failType`
// is `'500'`, the connection will respond with an HTTP 500.  If it is
// `'timeout'`, the request will delay and return an HTTP 504.
const banks = [
  { id: 'partner_bank', name: 'Partner Bank', failType: '500' },
  { id: 'national_timeout_bank', name: 'National Timeout Bank', failType: 'timeout' },
  { id: 'chase', name: 'Chase', failType: null },
  { id: 'wells_fargo', name: 'Wells Fargo', failType: null },
  { id: 'bank_of_america', name: 'Bank of America', failType: null },
  { id: 'citi', name: 'Citi', failType: null },
  { id: 'ally', name: 'Ally', failType: null },
  { id: 'capital_one', name: 'Capital One', failType: null },
  { id: 'truist', name: 'Truist', failType: null }
];

// Endpoint to return the list of banks
app.get('/api/banks', (req, res) => {
  res.json({ banks });
});

// Endpoint to simulate connecting to a bank.  The request body should
// include the `bankId` of the selected bank.  Different banks return
// different responses depending on their configured failure modes.
app.post('/api/connect', async (req, res) => {
  const { bankId } = req.body || {};
  const bank = banks.find(b => b.id === bankId);
  const sessionId = `sess_${Math.random().toString(36).slice(2, 10)}`;
  const baseEvent = {
    type: 'bank_connection_attempt',
    sessionId,
    bankId,
    timestamp: new Date().toISOString()
  };
  // Log the start of the attempt
  logEvent({ ...baseEvent, msg: 'attempt' });

  if (!bank) {
    const error = { error: 'bank_not_found', message: 'Bank not found' };
    logEvent({ ...baseEvent, outcome: 'error', error });
    return res.status(400).json(error);
  }

  const start = Date.now();
  try {
    if (bank.failType === 'timeout') {
      // Simulate a long delay to mimic an upstream timeout
      await new Promise(resolve => setTimeout(resolve, 10000));
      const error = { error: 'timeout', message: 'Bank timed out (simulated)' };
      logEvent({ ...baseEvent, outcome: 'error', error, durationMs: Date.now() - start });
      return res.status(504).json(error);
    }
    if (bank.failType === '500') {
      // Simulate an upstream internal server error
      const error = { error: 'upstream_500', message: 'Upstream returned 500 (simulated)' };
      logEvent({ ...baseEvent, outcome: 'error', error, httpStatus: 500, durationMs: Date.now() - start });
      return res.status(500).json(error);
    }
    // On success, generate a fake account mask and return a success payload
    const accountId = `acc_${Math.random().toString(36).slice(2, 8)}`;
    const mask = '****' + String(Math.floor(Math.random() * 9000 + 1000));
    const account = {
      accountId,
      institution: bank.name,
      mask,
      balances: { available: 1000, current: 1000 }
    };
    logEvent({ ...baseEvent, outcome: 'success', accountId, durationMs: Date.now() - start });
    res.json({ success: true, account });
  } catch (e) {
    const error = { error: 'server_error', message: e.message };
    logEvent({ ...baseEvent, outcome: 'error', error, durationMs: Date.now() - start });
    res.status(500).json(error);
  }
});

// Endpoint to return recent events from today's log file.  The events
// are returned in reverse chronological order (most recent first).
app.get('/api/events/recent', (req, res) => {
  const fileName = `${new Date().toISOString().slice(0, 10)}.events.log`;
  const filePath = path.join(logsDir, fileName);
  if (!fs.existsSync(filePath)) {
    return res.json({ events: [] });
  }
  const lines = fs.readFileSync(filePath, 'utf8')
    .trim().split('\n')
    .filter(Boolean)
    .map(l => {
      try { return JSON.parse(l); } catch { return { raw: l }; }
    })
    .reverse()
    .slice(0, 200);
  res.json({ events: lines });
});

// Serve the built frontend from the server in production.  When the
// application is built, the Vite output is copied into `server/client/dist`.
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Serve the built React app
const clientBuildPath = path.join(__dirname, 'client-build');
app.use(express.static(clientBuildPath));

// Handle all unmatched routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});
// Start the HTTP server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
