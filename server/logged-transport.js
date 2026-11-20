const { getRequestId } = require('./request-id');
const { StdioServerTransport } =
  require('@modelcontextprotocol/sdk/server/stdio.js');
const { logMcpEvent } = require('./mcp-logger');

class LoggedTransport extends StdioServerTransport {
  constructor(searchInputSchema) {
    super();
    this.searchInputSchema = searchInputSchema;
  }

  async start() {
    const handleMessage = this.onmessage;

    this.onmessage = (message, extra) => {
      this.inspectAndForward(message, extra, handleMessage)
        .catch(error => {
          console.error('MCP transport failed:', error.message);
          this.onerror?.(error);
        });
    };

    await super.start();
  }

  async inspectAndForward(message, extra, handleMessage) {
    try {
      if (message.method === 'tools/call' && 'id' in message) {
        const tool = message.params?.name;
        const args = message.params?.arguments;

        const knownTool = tool === 'search_profiles';
        const validInput = knownTool &&
          this.searchInputSchema.safeParse(args).success;

        if (!validInput) {
          await logMcpEvent({
            requestId: getRequestId(message.params?._meta),
            tool: typeof tool === 'string'
              ? tool.slice(0, 100)
              : 'unknown',
            outcome: 'rejected',
            parameters: {
              city: this.preview(args?.city),
              interest: this.preview(args?.interest)
            },
            errorCode: knownTool
              ? 'INVALID_ARGUMENTS'
              : 'UNKNOWN_TOOL'
          });
        }
      }
    } finally {
      // Always let the SDK perform its normal validation.
      handleMessage?.(message, extra);
    }
  }

  preview(value) {
    if (typeof value === 'string') {
      return value.slice(0, 100);
    }

    return `[${value === null ? 'null' : typeof value}]`;
  }
}

module.exports = { LoggedTransport };