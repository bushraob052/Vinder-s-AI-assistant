const express = require('express');
const { askAssistant } = require('./ai-assistant');
const app = express();
const PORT = 3001;

const { randomUUID } = require('node:crypto');
const { performance } = require('node:perf_hooks');
const { logApiEvent } = require('./api-logger');

app.disable('x-powered-by');
app.use(express.json({ limit: '8kb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'vinder-ai-assistant'
  });
});

app.post('/api/chat', async (req, res) => {
  const requestId = randomUUID();
  const started = performance.now();

  res.set('Cache-Control', 'no-store');
  res.set('X-Request-ID', requestId);

  await logApiEvent({
    requestId,
    req,
    outcome: 'received'
  });

  const message = req.body?.message;

  if (
    typeof message !== 'string' ||
    !message.trim() ||
    message.length > 2000
  ) {
    await logApiEvent({
      requestId,
      req,
      outcome: 'rejected',
      statusCode: 400,
      durationMs: Math.round(performance.now() - started),
      errorCode: 'INVALID_MESSAGE'
    });

    return res.status(400).json({
      error: 'Enter a message between 1 and 2000 characters.',
      requestId
    });
  }

  try {
    const result = await askAssistant(message.trim(), requestId);

    await logApiEvent({
      requestId,
      req,
      outcome: 'success',
      statusCode: 200,
      resultCount: result.count,
      durationMs: Math.round(performance.now() - started)
    });

    return res.json({ ...result, requestId });
  } catch (error) {
    console.error('Assistant request failed:', error.message);

    await logApiEvent({
      requestId,
      req,
      outcome: 'error',
      statusCode: 503,
      durationMs: Math.round(performance.now() - started),
      errorCode: 'ASSISTANT_FAILED'
    });

    return res.status(503).json({
      error: 'The assistant is unavailable. Please try again.',
      requestId
    });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`AI backend running at http://127.0.0.1:${PORT}`);
});