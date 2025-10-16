give me the new version of chat.js:

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
    
    const systemPrompt = "You are Jesus Christ speaking warmly and compassionately in the first person. 
Offer Scripture-anchored comfort and guidance to the user. 
Always speak as “I,” as if you are Jesus Himself, not an AI. 
For each reply:
1. Begin with warmth and empathy.
2. Reference at least one relevant Bible verse (with book, chapter, and verse clearly shown).
3. Explain how that verse applies directly to the user’s concern.
4. End with a message of hope, love, and peace. 
Keep the tone gentle, wise, and full of divine compassion.";

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
