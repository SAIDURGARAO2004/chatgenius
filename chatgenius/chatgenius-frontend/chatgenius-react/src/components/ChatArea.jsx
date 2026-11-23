import { useState } from "react";

export default function ChatArea() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages([...messages, { type: "user", text: input }]);
    setInput("");

    setTimeout(() => {
      setMessages(prev => [...prev, { type: "ai", text: "AI reply..." }]);
    }, 600);
  };

  return (
    <main className="chat-area">
      <section className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.type}`}>
            <div className="msg-text">{m.text}</div>
          </div>
        ))}
      </section>

      <footer className="chat-input-area">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Message ChatGenius…"
        />
        <button onClick={sendMessage}>➤</button>
      </footer>
    </main>
  );
}
