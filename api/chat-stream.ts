// /api/chat-stream.ts
export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { messages } = await req.json(); // [{role:"system"|"user"|"assistant", content:"..."}]

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Start SSE
      const headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      };
      controller.enqueue(encoder.encode("event: open\ndata: ok\n\n"));

      try {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            stream: true,
            messages,
          }),
        });

        if (!r.ok || !r.body) throw new Error("OpenAI stream failed");

        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });

          for (const line of buf.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") {
              controller.enqueue(encoder.encode("event: done\ndata: [DONE]\n\n"));
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const token = json.choices?.[0]?.delta?.content ?? "";
              if (token) controller.enqueue(encoder.encode(`data: ${JSON.stringify(token)}\n\n`));
            } catch { /* ignore parse errors */ }
          }
        }

        controller.enqueue(encoder.encode("event: done\ndata: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        controller.enqueue(encoder.encode(`event: error\ndata: "server error"\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
