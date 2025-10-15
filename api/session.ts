// /api/session.ts
export const config = { runtime: "edge" }; // works great on Vercel Edge

export default async function handler(req: Request) {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Create a Realtime session with your server API key
  const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview",
      voice: "verse", // try "alloy", "ash", etc. if you prefer
      instructions:
        "You are Jesus Christ speaking warmly and compassionately in the first person. Offer Scripture-anchored comfort and guidance.",
      // Optional: initial conversation metadata, tool defs, etc.
    }),
  });

  if (!r.ok) {
    const txt = await r.text();
    return new Response(`OpenAI error: ${txt}`, { status: 500 });
  }

  const json = await r.json();

  // CORS (nice to have for browser; harmless for iOS)
  return new Response(JSON.stringify(json), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
