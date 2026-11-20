const { searchThroughMcp } = require('./mcp-client');

async function askAssistant(message, requestId) {
  if (
    typeof message !== 'string' ||
    !message.trim() ||
    message.length > 2000
  ) {
    throw new Error('Enter a message between 1 and 2000 characters.');
  }

  const response = await fetch('http://127.0.0.1:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:1b',
      stream: false,
      options: { temperature: 0 },
      messages: [
        {
          role: 'system',
          content:
            'You are Vinder Assist. For a profile search, call ' +
            'search_profiles once using the city and interest ' +
            'explicitly supplied by the user. Do not invent missing ' +
            'search parameters or profiles.'
        },
        {
          role: 'user',
          content: message.trim()
        }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'search_profiles',
            description:
              'Search fictional public profiles by city and interest.',
            parameters: {
              type: 'object',
              properties: {
                city: { type: 'string' },
                interest: { type: 'string' }
              },
              required: ['city', 'interest']
            }
          }
        }
      ]
    }),
    signal: AbortSignal.timeout(120000)
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  const calls = data.message?.tool_calls || [];

  if (calls.length === 0) {
    return {
      reply: 'Please tell me a city and an interest to search for.',
      profiles: [],
      count: 0
    };
  }

  if (calls.length !== 1) {
    throw new Error('Expected one profile-search tool call.');
  }

  const tool = calls[0]?.function;

  if (tool?.name !== 'search_profiles') {
    throw new Error('The model requested an unsupported tool.');
  }

  const args = tool.arguments;

  if (
    !args ||
    typeof args.city !== 'string' ||
    typeof args.interest !== 'string' ||
    !args.city.trim() ||
    !args.interest.trim() ||
    args.city.length > 60 ||
    args.interest.length > 60
  ) {
    throw new Error('The model returned invalid search parameters.');
  }

    const result = await searchThroughMcp(
    args.city.trim(),
    args.interest.trim(),
    requestId
    );

  const descriptions = result.profiles.map(profile =>
    `${profile.name}, ${profile.age}, in ${profile.city}. ` +
    `Interests: ${profile.interests.join(', ')}.`
  );

  return {
    reply: result.count === 0
      ? 'No matching profiles were found.'
      : `Found ${result.count} matching profile(s):\n\n` +
        descriptions.join('\n\n'),
    profiles: result.profiles,
    count: result.count
  };
}

module.exports = { askAssistant };