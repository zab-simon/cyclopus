import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const sendRequest = async () => {
    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input }),
    });
    const data = await res.json();
    setResponse(data.output || "No response");
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Inter, sans-serif" }}>
      <h1>⚡ Cyclopus AI Analyst</h1>
      <textarea
        rows="4"
        cols="50"
        placeholder="Enter your query..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <br />
      <button onClick={sendRequest}>Send</button>
      <h3>Response:</h3>
      <pre>{response}</pre>
    </div>
  );
}