const path = require('node:path');
const { randomUUID } = require('node:crypto');

const { Client } =
  require('@modelcontextprotocol/sdk/client/index.js');

const { StdioClientTransport } =
  require('@modelcontextprotocol/sdk/client/stdio.js');

async function searchThroughMcp(city, interest, requestId = randomUUID()) {
  const client = new Client({
    name: 'vinder-assistant-client',
    version: '1.0.0'
  });

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(__dirname, 'mcp-server.js')]
  });

  try {
    await client.connect(transport);

    const result = await client.callTool({
    name: 'search_profiles',
    arguments: { city, interest },
    _meta: {
        requestId
    }
    });

    if (result.isError) {
      throw new Error('The MCP profile search failed.');
    }

    const text = result.content.find(item => item.type === 'text');

    if (!text) {
      throw new Error('MCP returned no text content.');
    }

    const data = JSON.parse(text.text);

    if (
      !Array.isArray(data.profiles) ||
      data.count !== data.profiles.length
    ) {
      throw new Error('MCP returned an unexpected result.');
    }

    return data;
  } finally {
    await client.close();
  }
}

module.exports = { searchThroughMcp };