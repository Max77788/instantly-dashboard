export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');

  try {
    const apiKey = process.env.INSTANTLY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Missing email id' });
    }

    const headers = { Authorization: `Bearer ${apiKey}` };

    const emailRes = await fetch(
      `https://api.instantly.ai/api/v2/emails/${encodeURIComponent(id)}`,
      { headers }
    );

    if (!emailRes.ok) {
      const text = await emailRes.text();
      return res.status(502).json({ error: `Email API error (${emailRes.status}): ${text}` });
    }

    const m = await emailRes.json();

    const email = {
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
      body: m.body?.html || m.body?.text || '',
      isUnread: m.is_unread === 1 || m.is_unread === true,
      isAutoReply: m.is_auto_reply === 1 || m.is_auto_reply === true,
      aiInterest: m.ai_interest_value || 0,
      createdAt: m.timestamp_created || m.timestamp_email || '',
      campaignId: m.campaign_id || '',
      attachmentJson: m.attachment_json || null,
      replyTo: m.reply_to || '',
      threadIdNew: m.thread_id || m.thread_id_new || '',
    };

    return res.status(200).json({ email, updated: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
