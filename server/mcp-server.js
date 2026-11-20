const { getRequestId } = require('./request-id');
const { performance } = require('node:perf_hooks');
const { logMcpEvent } = require('./mcp-logger');
const { McpServer } =
  require('@modelcontextprotocol/sdk/server/mcp.js');

const { LoggedTransport } = require('./logged-transport');

const { z } = require('zod');
const { searchProfiles } = require('./profile-service');

const server = new McpServer({
  name: 'vinder-profile-tools',
  version: '1.0.0'
});

const searchInputSchema = z.object({
  city: z.string().trim().min(1).max(60),
  interest: z.string().trim().min(1).max(60)
});

server.registerTool(
  'search_profiles',
  {
    description:
      'Search fictional public dating profiles by city and interest.',

    inputSchema: searchInputSchema.shape
  },
async ({ city, interest }, extra) => {
  const requestId = getRequestId(extra._meta);
  const parameters = { city, interest };

  await logMcpEvent({
    requestId,
    tool: 'search_profiles',
    outcome: 'received',
    parameters
  });

  const started = performance.now();

  try {
    const profiles = searchProfiles(city, interest);

    await logMcpEvent({
      requestId,
      tool: 'search_profiles',
      outcome: 'success',
      parameters,
      resultCount: profiles.length,
      durationMs: Math.round(performance.now() - started)
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            profiles,
            count: profiles.length
          })
        }
      ]
    };
  } catch (error) {
    await logMcpEvent({
      requestId,
      tool: 'search_profiles',
      outcome: 'error',
      parameters,
      durationMs: Math.round(performance.now() - started),
      errorCode: 'PROFILE_SEARCH_FAILED'
    });

    console.error('Profile search failed:', error.message);

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'The profile search is unavailable.'
        }
      ]
    };
  }
}
);

async function main() {
    const transport = new LoggedTransport(searchInputSchema);
  await server.connect(transport);

  console.error('Vinder MCP server is ready.');
}

main().catch(error => {
  console.error('MCP server failed:', error.message);
  process.exitCode = 1;
});