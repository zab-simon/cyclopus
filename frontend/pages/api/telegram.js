import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TELEGRAM_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Only POST allowed");

  const msg = req.body?.message;
  if (!msg || !msg.text || !msg.chat?.id)
    return res.status(400).send("Invalid message");

  const chatId = msg.chat.id;
  const text = msg.text.trim();

  try {
    const completion = await client.responses.create({
      model: "gpt-4o-mini",
      input: text,
    });

    const answer = completion.output_text || "⚙️ No response";

    await sendMessage(chatId, answer);
    res.status(200).send("✅ Sent");
  } catch (e) {
    console.error("❌ Error:", e.message);
    await sendMessage(chatId, "⚠️ Internal error, try later.");
    res.status(500).json({ error: e.message });
  }
}

async function sendMessage(chatId, text, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const r = await fetch(TELEGRAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (r.ok) return true;
    if (r.status === 429) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
  }
  throw new Error("TG sendMessage failed after retries.");
}
