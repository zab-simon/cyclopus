from fastapi import FastAPI, Request
from openai import OpenAI
from supabase import create_client
import os

app = FastAPI()

openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

PROMPT_ID = "pmpt_68e0c3eb4d188197a2659a6413c16ed90ec0f5b8"  # Cyclopus agent

@app.post("/chat")
async def chat(req: Request):
    data = await req.json()
    msg = data.get("message")
    uid = data.get("user_id")

    # OpenAI prompt call
    r = openai.responses.create(
        model="gpt-5-nano",
        prompt={"id": PROMPT_ID, "version": "1"},
        input=msg
    )
    reply = r.output[0].content[0].text

    # Save chat
    supabase.table("messages").insert({
        "user_id": uid,
        "user_message": msg,
        "bot_reply": reply
    }).execute()

    return {"reply": reply}
