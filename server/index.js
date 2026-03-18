const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');
const sessionsRouter = require('./routes/sessions');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({ origin: isProd ? false : 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/sessions', sessionsRouter);

// Serve static files in production
if (isProd) {
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🧹 Cobalt Clean Interview Tool`);
      console.log(`   Server running on http://localhost:${PORT}`);
      if (!isProd) console.log(`   Client dev server on http://localhost:3000\n`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
