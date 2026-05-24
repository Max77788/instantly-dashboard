export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  try {
    const apiKey = process.env.INSTANTLY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
    }

    const { thread_id } = req.query;
    if (!thread_id) {
      return res.status(400).json({ error: 'Missing thread_id' });
    }

    const headers = { Authorization: `Bearer ${apiKey}` };

    const emailRes = await fetch(
      `https://api.instantly.ai/api/v2/emails?search=thread:${encodeURIComponent(thread_id)}&limit=100&sort_order=asc`,
      { headers }
    );

    if (!emailRes.ok) {
      const text = await emailRes.text();
      return res.status(502).json({ error: `Emails API error (${emailRes.status}): ${text}` });
    }

    const emailData = await emailRes.json();
    const raw = emailData.items || [];

    const messages = raw.map(m => ({
      id: m.id,
      threadId: m.thread_id || '',
      subject: m.subject || '(no subject)',
      from: m.from_address_email || '',
      to: (m.to_address_email_list || '').split(',').map(s => s.trim()).filter(Boolean),
      cc: (m.cc_address_email_list || '').split(',').map(s => s.trim()).filter(Boolean),
      lead: m.lead || '',
      eaccount: m.eaccount || '',
      bodyHtml: m.body?.html || '',
      bodyText: m.body?.text || '',
      isUnread: m.is_unread === 1 || m.is_unread === true,
      isAutoReply: m.is_auto_reply === 1 || m.is_auto_reply === true,
      aiInterest: m.ai_interest_value || 0,
      createdAt: m.timestamp_created || m.timestamp_email || '',
      type: m.ue_type === 1 ? 'sent' : m.ue_type === 3 ? 'received' : 'manual',
      responseType: classifyThreadResponse(m),
    }));

    return res.status(200).json({ messages, updated: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function classifyThreadResponse(m) {
  const interest = m.ai_interest_value || 0;
  const isAuto = m.is_auto_reply === 1 || m.is_auto_reply === true;
  const body = ((m.body?.text || '')).toLowerCase();
  const subject = (m.subject || '').toLowerCase();
  const negativePatterns = ['unsubscribe', 'opt out', 'opt-out', 'remove me', 'not interested',
    'do not contact', 'stop emailing'];
  if (negativePatterns.some(p => body.includes(p) || subject.includes(p))) return 'negative';
  if (isAuto) return 'auto';
  if (interest >= 0.5) return 'positive';
  if (interest > 0.2) return 'interested';
  if (interest > 0) return 'neutral';
  return 'unknown';
}
