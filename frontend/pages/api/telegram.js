import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- CONFIG ---
const MAX_MSG_LEN = 3500; // защита от перегруза
const RETRY_COUNT = 2; // повтор при неудаче

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const msg = req.body?.message?.text?.trim();
  const chatId = req.body?.message?.chat?.id;

  if (!msg || !chatId) return res.status(400).json({ error: "Empty message" });
  if (msg.length > MAX_MSG_LEN) {
    await sendToTG(chatId, "⚠️ Сообщение слишком длинное. Сократите его, пожалуйста.");
    return res.status(400).json({ error: "Message too long" });
  }

  try {
    // --- CALL OPENAI ---
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: msg }],
      temperature: 0.6,
      max_tokens: 800,
    });

    const answer = response?.choices?.[0]?.message?.content?.trim() || "⚠️ Нет ответа от модели.";

    // --- SEND BACK TO TELEGRAM ---
    await sendToTG(chatId, answer);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("TG handler error:", err);
    await sendToTG(chatId, "❌ Ошибка на сервере. Попробуйте чуть позже.");
    res.status(500).json({ error: err.message });
  }
}

// helper: send message with retry
async function sendToTG(chatId, text) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = JSON.stringify({ chat_id: chatId, text });

  for (let i = 0; i <= RETRY_COUNT; i++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (res.ok) return true;
    await new Promise(r => setTimeout(r, 500 * (i + 1)));
  }
  console.error("TG sendMessage failed after retries.");
}
