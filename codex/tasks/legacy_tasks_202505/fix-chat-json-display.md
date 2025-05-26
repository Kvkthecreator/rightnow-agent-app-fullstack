## codex/tasks/fix-chat-json-display.md

✅ Final Codex Task: fix-chat-json-display.md

## 📄 Task Title
Fix agent chat display to only show message content, not full JSON

## 🎯 Goal
Improve the user experience in the agent chat UI by rendering only the `"message_content"` string from the JSON response — instead of showing the full JSON blob.

Currently, messages like this:

```json
{ "type": "text", "message_content": "Who are you hoping to reach?" }
appear as raw JSON in the UI. Instead, we want to extract just the "message_content" and render it.

🧠 Prompt to Codex

Update the chat message renderer to safely parse agent messages and only display the `message_content` value.

If `message.content` is a JSON string that includes a `"message_content"` key, display just that value.

If parsing fails or `message_content` is missing, fall back to displaying the raw string.

Example logic:

let parsedMessage: string;

try {
  const json = JSON.parse(message.content);
  parsedMessage = json.message_content || message.content;
} catch {
  parsedMessage = message.content;
}

Then render:
<p>{parsedMessage}</p>
🧩 Related Files

components/chat/ChatMessage.tsx
🧱 React Stub (append to bottom of task for Codex)

// ChatMessage.tsx
interface ChatMessageProps {
  message: {
    content: string;
    sender: 'user' | 'agent';
    created_at?: string;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  let parsedMessage: string;

  try {
    const json = JSON.parse(message.content);
    parsedMessage = json.message_content || message.content;
  } catch {
    parsedMessage = message.content;
  }

  return (
    <div className={`chat-message ${message.sender}`}>
      <p>{parsedMessage}</p>
    </div>
  );
}