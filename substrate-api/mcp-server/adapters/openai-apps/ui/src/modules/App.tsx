import { useEffect, useState } from 'react';
import './App.css';

interface HostEvent {
  event: string;
  payload: unknown;
}

export function App() {
  const [events, setEvents] = useState<HostEvent[]>([]);

  useEffect(() => {
    function handleMessage(message: MessageEvent) {
      try {
        const data = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
        if (!data || typeof data.event !== 'string') {
          return;
        }
        setEvents((prev) => [{ event: data.event, payload: data.payload }, ...prev].slice(0, 25));
      } catch {
        // ignore malformed messages
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function notifyHost() {
    window.openai?.sendEvent('yarnnn.ui.ping', { timestamp: Date.now() });
  }

  return (
    <div className="yarnnn-shell">
      <header>
        <h1>Yarnnn Apps Shell</h1>
        <p>Placeholder UI served to ChatGPT while full Apps SDK wiring is in progress.</p>
        <button type="button" onClick={notifyHost}>
          Send ping to host
        </button>
      </header>
      <section>
        <h2>Recent Host Events</h2>
        <ul>
          {events.length === 0 && <li>Waiting for host events…</li>}
          {events.map((entry, idx) => (
            <li key={`${entry.event}-${idx}`}>
              <code>{entry.event}</code>
              <pre>{JSON.stringify(entry.payload, null, 2)}</pre>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
