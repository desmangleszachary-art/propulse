export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { rfp, company } = body || {};

  if (!rfp || !company) {
    return res.status(400).json({ error: 'RFP and company info are required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: 'You are an expert proposal writer. Generate a complete, professional, winning proposal response with clear sections: Executive Summary, Understanding of Requirements, Proposed Solution, Team & Qualifications, Experience & References, Implementation Timeline, Pricing, and Why Choose Us. Use the company information provided to personalize every section.',
        messages: [{
          role: 'user',
          content: `Generate a complete proposal for this RFP:\n\n=== RFP ===\n${rfp}\n\n=== OUR COMPANY ===\n${company}`
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Anthropic API error' });
    }

    const result = data.content?.[0]?.text;
    if (!result) {
      return res.status(500).json({ error: 'No content returned from API' });
    }

    return res.status(200).json({ result });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
