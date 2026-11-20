const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const logFile = path.join(__dirname, 'logs', 'mcp-events.jsonl');

async function logMcpEvent({
  requestId,
  tool,
  outcome,
  parameters,
  resultCount = null,
  durationMs = null,
  errorCode = null
}) {
  const event = {
    timestamp: new Date().toISOString(),
    event_id: randomUUID(),
    request_id: requestId,
    service: 'vinder-mcp',
    tool,
    outcome,
    parameters,
    result_count: resultCount,
    duration_ms: durationMs,
    error_code: errorCode
  };

  try {
    await fs.mkdir(path.dirname(logFile), { recursive: true });
    await fs.appendFile(logFile, JSON.stringify(event) + '\n', 'utf8');
    return true;
  } catch (error) {
    console.error('MCP logging failed:', error.message);
    return false;
  }
}

module.exports = { logMcpEvent };