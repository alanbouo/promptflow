import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve as serveInngest } from 'inngest/hono';

import auth from './routes/auth.js';
import templates from './routes/templates.js';
import jobs from './routes/jobs.js';
import user from './routes/user.js';
import refine from './routes/refine.js';
import { inngest } from './inngest/client.js';
import { functions as inngestFunctions } from './inngest/functions.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.route('/api/auth', auth);
app.route('/api/templates', templates);
app.route('/api/jobs', jobs);
app.route('/api/user', user);
app.route('/api/refine', refine);

// Inngest endpoint - the self-hosted Inngest server calls this to discover
// and trigger functions. Sync it from the Inngest UI (Apps -> Sync) pointing
// to http://<this-service>:4000/api/inngest.
app.use('/api/inngest', async (c) => serveInngest({ client: inngest, functions: inngestFunctions })(c));

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = parseInt(process.env.PORT || '4000', 10);

console.log(`🚀 PromptFlow API server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running at http://localhost:${port}`);
