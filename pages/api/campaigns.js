export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  try {
    const apiKey = process.env.INSTANTLY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
    }

    const headers = { Authorization: `Bearer ${apiKey}` };

    // Fetch only active campaigns (status=1) directly from the API
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
      return res.status(200).json({ campaigns: [], updated: new Date().toISOString() });
    }

    // Fetch analytics for active campaigns via GET with repeated ids query params
    const analyticsParams = campaigns.map(c => `ids=${encodeURIComponent(c.id)}`).join('&');
    const analyticsUrl = `https://api.instantly.ai/api/v2/campaigns/analytics?${analyticsParams}`;

    const analyticsRes = await fetch(analyticsUrl, { headers });

    if (!analyticsRes.ok) {
      const text = await analyticsRes.text();
      return res.status(502).json({ error: `Instantly analytics API error (${analyticsRes.status}): ${text}` });
    }

    const analyticsData = await analyticsRes.json();
    const analytics = Array.isArray(analyticsData) ? analyticsData : [];

    // Merge campaign list with analytics on campaign_id
    const merged = campaigns.map(c => {
      const a = analytics.find(x => x.campaign_id === c.id) || {};
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        leads: a.leads_count || 0,
        sent: a.emails_sent_count || 0,
        contacted: a.contacted_count || 0,
        replies: a.reply_count || 0,
        bounced: a.bounced_count || 0,
        opportunities: a.total_opportunities || 0,
        opens: a.open_count_unique || 0
      };
    });

    // Fetch daily analytics for active campaigns (last 30 days)
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

    return res.status(200).json({ campaigns: merged, daily, updated: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
