import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sendMessage = async (chatId, text) => {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = { chat_id: chatId, text };

  // надёжная отправка с 3 попытками и экспоненциальной задержкой
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) return;
      const errText = await res.text();
      console.warn(`TG send fail [${attempt}]: ${errText}`);

      // если rate limit — подождать больше
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      } else {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    } catch (err) {
      console.error(`TG send exception [${attempt}]:`, err.message);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  const msg = req.body?.message?.text;
  const chatId = req.body?.message?.chat?.id;
  if (!msg || !chatId)
    return res.status(400).json({ error: "Invalid Telegram payload" });

  try {
    console.log("TG IN:", msg);

    const completion = await client.responses.create({
      model: "gpt-4o-mini",
      input: msg,
    });

    const answer = completion.output_text?.trim() || "⚠️ No response.";
    await sendMessage(chatId, answer);

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("TG handler error:", e);
    await sendMessage(chatId, "⚠️ Internal server error. Try later.");
    res.status(500).json({ error: e.message });
  }
}
