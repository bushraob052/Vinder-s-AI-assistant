import { useState } from 'react'
import './App.css'

function App() {
  const [input, setInput] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! Tell me a city and an interest.',
    },
  ])

  async function handleSubmit(event) {
    event.preventDefault()

    const text = input.trim()
    if (!text || waiting) return

    setWaiting(true)
    setError('')
    setInput('')

    setMessages((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        role: 'user',
        text,
      },
    ])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'The request failed.')
      }

      if (typeof data.reply !== 'string') {
        throw new Error('The server returned an unexpected response.')
      }

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: data.reply,
        },
      ])
    } catch (error) {
      setError(error.message)
      setInput(text)
    } finally {
      setWaiting(false)
    }
  }

  return (
    <main>
      <h1>Vinder Assist</h1>
      <p>Find a connection through shared interests.</p>

      <section aria-label="Conversation" role="log" aria-live="polite">
        {messages.map((message) => (
          <p
            key={message.id}
            className={
              message.role === 'user' ? 'user-message' : 'assistant-message'
            }
          >
            <strong>
              {message.role === 'user' ? 'You' : 'Vinder Assist'}
            </strong>
            {message.text}
          </p>
        ))}
      </section>

      {waiting && <p role="status">Waiting for a response…</p>}
      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="message">Your message</label>

        <input
          id="message"
          name="message"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Find someone in Breda who likes coffee"
          maxLength={2000}
          disabled={waiting}
          required
        />

        <button type="submit" disabled={waiting || !input.trim()}>
          {waiting ? 'Sending…' : 'Send'}
        </button>
      </form>
    </main>
  )
}

export default App