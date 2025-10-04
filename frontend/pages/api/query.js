import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });
  const { prompt } = req.body;
  try {
    const completion = await client.responses.create({
      model: "gpt-5-mini",
      input: prompt
    });
    res.status(200).json({ result: completion.output_text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
