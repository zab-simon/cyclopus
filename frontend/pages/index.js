import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState("");

  const sendMsg = async () => {
    const r = await axios.post("/api/chat", { message: msg });
    setReply(r.data.reply);
  };

  return (
    <main style={{ padding: 20 }}>
      <h2>🧠 Cyclopus AI Analyst</h2>
      <textarea rows="3" value={msg} onChange={e => setMsg(e.target.value)} />
      <button onClick={sendMsg}>Send</button>
      <p><b>Response:</b> {reply}</p>
    </main>
  );
}
