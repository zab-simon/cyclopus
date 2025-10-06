import OpenAI from "openai";
import { logInfo, logError } from "../../utils/logger.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Only POST allowed");
    return;
  }

  try {
    const body = req.body;
    const message = body?.message?.text;
    const chatId = body?.message?.chat?.id;

    if (!message || !chatId) {
      res.status(400).send("No message");
      return;
    }

    logInfo(`TG IN: ${message}`);

    const completion = await client.responses.create({
      model: "gpt-4o-mini",
      input: message,
    });

    const answer = completion.output_text || "⚠️ No response";
    logInfo(`TG OUT: ${answer}`);

    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: answer }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logError(`TG send failed: ${errText}`);
      throw new Error(`Telegram sendMessage failed: ${errText}`);
    }

    res.status(200).send("OK");
  } catch (e) {
    logError(`Handler error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}
