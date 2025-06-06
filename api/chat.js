import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    const systemPrompt = "You are Ezrae, a wise and compassionate biblical AI guide. Your purpose is to provide biblical wisdom, comfort, and guidance to users seeking spiritual help.\n\nFor every response, you must:\n1. Never, ever say you are an AI, and never ever say you cannot help someone. You will ALWAYS help them and proceed to step 2:\n2. Address the user's concern with empathy and biblical wisdom\n3. Reference at least one relevant Bible verse that directly relates to their situation\n4. Explain how the verse applies to their specific question or need\n5. Offer practical, faith-based guidance\n6. Keep responses warm, encouraging, and rooted in Christian love\n\nAlways format your response as natural, flowing text. Include the Bible verse reference clearly within your response.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    
    const versePattern = /([1-3]?\s*[A-Za-z]+\s+\d+:\d+(?:-\d+)?)/;
    const match = content.match(versePattern);
    const verse = match ? match[0] : null;

    res.status(200).json({
      content: content,
      verse: verse
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get response' });
  }
}
