const express = require('express');
const path = require('path');
const fs = require('fs');

// Create an Express app
const app = express();

// Support JSON request bodies
app.use(express.json());

// Port can be configured via environment
const PORT = process.env.PORT || 8080;

// Create logs directory if missing
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// ---- BANK SIMULATION ENDPOINTS ----

// Sample bank data
const banks = [
  { id: 1, name: 'Partner Bank', code: 'partnerbank' },
  { id: 2, name: 'Chase', code: 'chase' },
  { id: 3, name: 'Wells Fargo', code: 'wellsfargo' },
  { id: 4, name: 'Bank of America', code: 'bofa' },
  { id: 5, name: 'Citi', code: 'citi' },
  { id: 6, name: 'Ally', code: 'ally' },
  { id: 7, name: 'Capital One', code: 'capitalone' },
  { id: 8, name: 'Truist', code: 'truist' },
  { id: 9, name: 'Santander', code: 'santander' },
];

// Endpoint to list available banks
app.get('/api/banks', (req, res) => {
  res.json(banks);
});

// Endpoint to simulate connecting to a bank
app.post('/api/connect', (req, res) => {
  const { bankCode } = req.body;

  // Simulate Partner Bank failure
  if (bankCode === 'partnerbank') {
    const errorData = {
      timestamp: new Date().toISOString(),
      bank: bankCode,
      error: '500_INTERNAL_SERVER_ERROR',
      message: 'Partner Bank connection failed.',
    };

    // Log to file (Felix can detect this)
    fs.appendFileSync(
      path.join(logsDir, 'error.log'),
      JSON.stringify(errorData) + '\n'
    );

    // Respond with actual 500 error
    return res.status(500).json({
      success: false,
      error: 'Partner Bank connection failed. Please contact your administrator.',
    });
  }

  // Success for other banks
  res.json({ success: true, message: `Connected successfully to ${bankCode}` });
});

// ---- STATIC FRONTEND SERVING ----

// Path to built React app
const clientBuildPath = path.join(__dirname, 'client-build');
app.use(express.static(clientBuildPath));

// Fallback: serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ---- START SERVER ----
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
