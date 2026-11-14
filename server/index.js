// NEXUS FLOOD — Main Express Server Entry Point
// NOTE: This project uses ES modules. Ensure package.json contains "type": "module"
// ES module syntax

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import incidentsRouter from './routes/incidents.js';
import analyzeRouter from './routes/analyze.js';
import resourcesRouter from './routes/resources.js';
import alertsRouter from './routes/alerts.js';
import actionsRouter from './routes/actions.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server dir or root dir
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

// CORS — allow Vite dev server
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use(limiter);

// JSON body parser with 10MB limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'nexus-flood-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: {
      gemini_configured: !!process.env.GEMINI_API_KEY,
      supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      noaa_enabled: true,
    },
  });
});

// ---------------------------------------------------------------------------
// Mount routes
// ---------------------------------------------------------------------------
app.use('/api/incidents', incidentsRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/actions', actionsRouter);

// ---------------------------------------------------------------------------
// Serve frontend static build if available
// ---------------------------------------------------------------------------
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ---------------------------------------------------------------------------
// 404 handler for API routes
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} does not exist`,
    available_endpoints: [
      'GET  /api/health',
      'GET  /api/incidents',
      'POST /api/incidents',
      'GET  /api/incidents/:id',
      'PATCH /api/incidents/:id',
      'POST /api/analyze',
      'POST /api/analyze/verify',
      'GET  /api/resources',
      'GET  /api/alerts',
      'GET  /api/actions',
      'POST /api/actions',
      'PATCH /api/actions/:id',
    ],
  });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err, req, res, _next) => {
  console.error('[server] Unhandled error:', err.message);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 20MB per file.' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({ error: 'Too many files. Maximum is 5 files per request.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field name. Use "files" as the field name.' });
  }

  return res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║           NEXUS FLOOD API Server v1.0.0              ║
║──────────────────────────────────────────────────────║
║  Port:     ${String(PORT).padEnd(40)}║
║  CORS:     localhost:5173, localhost:3000             ║
║  Gemini:   ${(process.env.GEMINI_API_KEY ? 'Configured ✓' : 'Not configured (demo mode)').padEnd(40)}║
║  Supabase: ${((process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) ? 'Configured ✓' : 'Not configured (in-memory)').padEnd(40)}║
║  NOAA:     Enabled (live alerts)                     ║
╚══════════════════════════════════════════════════════╝
  `);
});

export default app;
