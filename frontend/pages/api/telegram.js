import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Only POST allowed");

  try {
    const body = req.body;
    const message = body?.message?.text;
    const chatId = body?.message?.chat?.id;

    console.log("TG IN:", message);

    if (!message || !chatId)
      return res.status(400).send("No message or chat ID");

    // Обработка /start и базовых команд
    if (message === "/start") {
      await sendTelegram(chatId, "👋 Привет! Я Cyclopus AI Analyst. Напиши вопрос.");
      return res.status(200).send("OK");
    }

    // Основной OpenAI запрос
    const completion = await client.responses.create({
      model: "gpt-4o-mini",
      input: message,
    });

    const answer = completion.output_text || "⚠️ No response";

    await sendTelegram(chatId, answer);
    res.status(200).send("OK");
  } catch (e) {
    console.error("TG handler error:", e.message);
    await safeTelegramFallback(e.message);
    res.status(500).json({ error: e.message });
  }
}

// 🔧 безопасная отправка сообщения в Telegram
async function sendTelegram(chatId, text) {
  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }
    );
  } catch (err) {
    console.error("TG sendMessage failed:", err.message);
  }
}

// 🛡 fallback — логирует в Supabase или консоль
async function safeTelegramFallback(msg) {
  console.error("⚠️ OpenAI error fallback:", msg);
}
