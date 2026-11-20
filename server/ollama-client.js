async function askOllama(message) {
  if (
    typeof message !== 'string' ||
    !message.trim() ||
    message.length > 2000
  ) {
    throw new Error('Enter a message between 1 and 2000 characters.');
  }

  const response = await fetch('http://127.0.0.1:11434/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3.2:1b',
      stream: false,
      messages: [
        {
          role: 'system',
          content:
            'You are Vinder Assist. Keep answers short. ' +
            'You do not have access to profile data yet. ' +
            'Do not invent profiles or claim to have searched a database.'
        },
        {
          role: 'user',
          content: message.trim()
        }
      ],
      options: {
        temperature: 0
      }
    }),
    signal: AbortSignal.timeout(120000)
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  const reply = data.message?.content;

  if (typeof reply !== 'string' || !reply.trim()) {
    throw new Error('Ollama returned an empty response.');
  }

  return reply.trim();
}

module.exports = { askOllama };