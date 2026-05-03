export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  try {
    const apiKey = process.env.INSTANTLY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
    }

    const headers = { Authorization: `Bearer ${apiKey}` };

    // Fetch active campaigns
    const listRes = await fetch(
      'https://api.instantly.ai/api/v2/campaigns?status=1&limit=100',
      { headers }
    );

    if (!listRes.ok) {
      const text = await listRes.text();
      return res.status(502).json({ error: `Instantly campaigns API error (${listRes.status}): ${text}` });
    }

    const listData = await listRes.json();
    const campaigns = listData.items || [];

    if (campaigns.length === 0) {
      return res.status(200).json({ stats: null, daily: [], campaigns: [], updated: new Date().toISOString() });
    }

    // Fetch aggregated analytics overview
    const overviewRes = await fetch(
      'https://api.instantly.ai/api/v2/campaigns/analytics/overview?campaign_status=1',
      { headers }
    );

    let stats = null;
    if (overviewRes.ok) {
      const d = await overviewRes.json();
      stats = {
        emailsSent: d.emails_sent_count || 0,
        contacted: d.contacted_count || 0,
        newLeadsContacted: d.new_leads_contacted_count || 0,
        openCount: d.open_count || 0,
        openUnique: d.open_count_unique || 0,
        clickCount: d.link_click_count || 0,
        clickUnique: d.link_click_count_unique || 0,
        replyCount: d.reply_count || 0,
        replyUnique: d.reply_count_unique || 0,
        replyAutomatic: d.reply_count_automatic || 0,
        replyAutomaticUnique: d.reply_count_automatic_unique || 0,
        bounced: d.bounced_count || 0,
        unsubscribed: d.unsubscribed_count || 0,
        completed: d.completed_count || 0,
        opportunities: d.total_opportunities || 0,
        opportunityValue: d.total_opportunity_value || 0,
        interested: d.total_interested || 0,
        meetingsBooked: d.total_meeting_booked || 0,
        meetingsCompleted: d.total_meeting_completed || 0,
        closed: d.total_closed || 0,
      };
    }

    // Fetch daily analytics — configurable days (default 7)
    const days = parseInt(req.query.days, 10) || 7;
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

    const dailyRes = await fetch(
      `https://api.instantly.ai/api/v2/campaigns/analytics/daily?campaign_status=1&start_date=${startDate}&end_date=${endDate}`,
      { headers }
    );

    let daily = [];
    if (dailyRes.ok) {
      const dailyData = await dailyRes.json();
      daily = Array.isArray(dailyData) ? dailyData : [];
    }

    // Return campaign names for the table header context
    const campaignNames = campaigns.map(c => ({ id: c.id, name: c.name }));

    return res.status(200).json({
      stats,
      daily,
      campaigns: campaignNames,
      updated: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
