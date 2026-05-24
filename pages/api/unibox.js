export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  try {
    const apiKey = process.env.INSTANTLY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
    }

    const headers = { Authorization: `Bearer ${apiKey}` };

    // 1. Fetch all email accounts
    const acctRes = await fetch(
      'https://api.instantly.ai/api/v2/accounts?status=1&limit=100',
      { headers }
    );

    if (!acctRes.ok) {
      const text = await acctRes.text();
      return res.status(502).json({ error: `Accounts API error (${acctRes.status}): ${text}` });
    }

    const acctData = await acctRes.json();
    const allAccounts = acctData.items || [];

    if (allAccounts.length === 0) {
      return res.status(200).json({ messages: [], accounts: [], updated: new Date().toISOString() });
    }

    // 2. Fetch emails for all accounts
    const emailRes = await fetch(
      `https://api.instantly.ai/api/v2/emails?limit=50&sort_order=desc`,
      { headers }
    );

    if (!emailRes.ok) {
      const text = await emailRes.text();
      return res.status(502).json({ error: `Emails API error (${emailRes.status}): ${text}` });
    }

    const emailData = await emailRes.json();
    const raw = emailData.items || [];

    const messages = raw
      .filter(m => {
        const e = (m.eaccount || '').toLowerCase();
        const f = (m.from_address_email || '').toLowerCase();
        return e.endsWith('@sunitausa.com') || f.endsWith('@sunitausa.com');
      })
      .map(m => ({
      id: m.id,
      threadId: m.thread_id || '',
      subject: m.subject || '(no subject)',
      from: m.from_address_email || '',
      to: (m.to_address_email_list || '').split(',').map(s => s.trim()).filter(Boolean),
      lead: m.lead || '',
      leadId: m.lead_id || '',
      eaccount: m.eaccount || '',
      bodyPreview: m.content_preview || (m.body?.text || '').slice(0, 200),
      isUnread: m.is_unread === 1 || m.is_unread === true,
      isFocused: m.is_focused === 1 || m.is_focused === true,
      isAutoReply: m.is_auto_reply === 1 || m.is_auto_reply === true,
      aiInterest: m.ai_interest_value || 0,
      createdAt: m.timestamp_created || m.timestamp_email || '',
      campaignId: m.campaign_id || '',
      type: m.ue_type === 1 ? 'sent' : m.ue_type === 3 ? 'received' : 'manual',
      responseType: classifyResponse(m),
    }));

    return res.status(200).json({
      messages,
      accounts: allAccounts.map(a => ({ email: a.email, provider: a.provider_name || '' })),
      updated: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function classifyResponse(m) {
  const interest = m.ai_interest_value || 0;
  const isAuto = m.is_auto_reply === 1 || m.is_auto_reply === true;
  const body = (m.content_preview || m.body_preview || (m.body?.text || '')).toLowerCase();
  const subject = (m.subject || '').toLowerCase();

  // Negative signals
  const negativePatterns = [
    'unsubscribe', 'opt out', 'opt-out', 'remove me', 'not interested',
    'do not contact', 'stop emailing', 'take me off', 'no thanks',
    "i'm not interested", 'leave me alone'
  ];
  const isNegative = negativePatterns.some(p => body.includes(p) || subject.includes(p));

  if (isNegative) return 'negative';
  if (isAuto) return 'auto';
  if (interest >= 0.5) return 'positive';
  if (interest > 0.2) return 'interested';
  if (interest > 0) return 'neutral';
  return 'unknown';
}
