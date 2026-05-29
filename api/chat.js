// api/chat.js
export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  // 从环境变量读取 API Key（稍后在 Vercel 里配置）
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key not configured' });
  }

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: messages,
        stream: false,
        temperature: 0.2,
        max_tokens: 500
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '抱歉，我无法回答。';
    return res.status(200).json({ reply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}