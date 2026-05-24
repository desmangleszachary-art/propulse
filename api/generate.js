export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rfp, company } = req.body;

  if (!rfp || !company) {
    return res.status(400).json({ error: 'RFP and company info are required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: `You are an expert proposal writer with 15 years of experience winning government and enterprise RFPs. 
Generate a complete, professional, winning proposal response.

Structure your response with clear sections using markdown:
# PROPOSAL RESPONSE
## 1. Executive Summary
## 2. Understanding of Requirements
## 3. Proposed Solution
## 4. Team & Qualifications
## 5. Relevant Experience & References
## 6. Implementation Timeline
## 7. Pricing & Investment
## 8. Why Choose Us

Be specific, confident, and professional. Match the exact sections and scoring criteria from the RFP. Use the company information provided to personalize every section.`,
        messages: [{
          role: 'user',
          content: `Generate a complete proposal for this RFP:

=== RFP CONTENT ===
${rfp}

=== OUR COMPANY INFORMATION ===
${company}

Generate a full, submission-ready proposal. Be thorough, specific, and professional.`
        }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const result = data.content?.[0]?.text || 'Error generating proposal.';
    return res.status(200).json({ result });

  } catch (error) {
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
