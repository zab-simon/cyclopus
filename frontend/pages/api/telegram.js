import OpenAI from "openai";
import { logInfo, logError } from "../../utils/logger.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    logError("Wrong method", req.method);
    return res.status(405).send("Only POST allowed");
  }

  const body = req.body;
  const message = body?.message?.text;
  const chatId = body?.message?.chat?.id;

  if (!message || !chatId) {
    logError("Empty message or chatId", body);
    return res.status(400).send("No message");
  }

  logInfo("TG IN", { chatId, message });

  try {
    const completion = await client.responses.create({
      model: "gpt-4o-mini",
      input: message,
    });

    const answer = completion.output_text?.trim() || "🤖 No response";
    logInfo("GPT OUT", answer);

    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: answer }),
      }
    );

    const result = await tgRes.json();
    if (!result.ok) throw new Error(JSON.stringify(result));

    logInfo("TG SENT", result);
    res.status(200).send("OK");
  } catch (err) {
    logError("Handler Error", err.message || err);
    res.status(500).json({ error: err.message });
  }
}
