export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  try {
    const apiKey = process.env.INSTANTLY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
    }

    const headers = { Authorization: `Bearer ${apiKey}` };

    // Fetch only active campaigns (status=1)
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
      return res.status(200).json({ stats: null, daily: [], campaignCount: 0, updated: new Date().toISOString() });
    }

    // Fetch aggregated analytics overview for all active campaigns (no campaign IDs = all)
    const overviewRes = await fetch(
      'https://api.instantly.ai/api/v2/campaigns/analytics/overview?campaign_status=1',
      { headers }
    );

    let stats = null;
    if (overviewRes.ok) {
      const overviewData = await overviewRes.json();
      // overviewData is a single object with all aggregate fields
      stats = {
        emailsSent: overviewData.emails_sent_count || 0,
        contacted: overviewData.contacted_count || 0,
        newLeadsContacted: overviewData.new_leads_contacted_count || 0,
        openCount: overviewData.open_count || 0,
        openUnique: overviewData.open_count_unique || 0,
        clickCount: overviewData.link_click_count || 0,
        clickUnique: overviewData.link_click_count_unique || 0,
        replyCount: overviewData.reply_count || 0,
        replyUnique: overviewData.reply_count_unique || 0,
        replyAutomatic: overviewData.reply_count_automatic || 0,
        replyAutomaticUnique: overviewData.reply_count_automatic_unique || 0,
        bounced: overviewData.bounced_count || 0,
        unsubscribed: overviewData.unsubscribed_count || 0,
        completed: overviewData.completed_count || 0,
        opportunities: overviewData.total_opportunities || 0,
        opportunityValue: overviewData.total_opportunity_value || 0,
        interested: overviewData.total_interested || 0,
        meetingsBooked: overviewData.total_meeting_booked || 0,
        meetingsCompleted: overviewData.total_meeting_completed || 0,
        closed: overviewData.total_closed || 0,
      };
    }

    // Fetch daily analytics (last 30 days)
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const dailyRes = await fetch(
      `https://api.instantly.ai/api/v2/campaigns/analytics/daily?campaign_status=1&start_date=${startDate}&end_date=${endDate}`,
      { headers }
    );

    let daily = [];
    if (dailyRes.ok) {
      const dailyData = await dailyRes.json();
      daily = Array.isArray(dailyData) ? dailyData : [];
    }

    return res.status(200).json({
      stats,
      daily,
      campaignCount: campaigns.length,
      updated: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
