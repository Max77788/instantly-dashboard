export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  try {
    const apiKey = process.env.INSTANTLY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
    }

    const listRes = await fetch('https://api.instantly.ai/api/v2/campaigns?limit=100', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const listData = await listRes.json();
    const allCampaigns = listData.items || [];
    const activeCampaigns = allCampaigns.filter(c => c.status === 1);

    if (activeCampaigns.length === 0) {
      return res.status(200).json({ campaigns: [], analytics: [] });
    }

    const ids = activeCampaigns.map(c => c.id);

    const analyticsRes = await fetch('https://api.instantly.ai/api/v2/analytics/campaign/summary', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ campaign_ids: ids })
    });
    const analyticsData = await analyticsRes.json();
    const analytics = Array.isArray(analyticsData) ? analyticsData : [];

    const merged = activeCampaigns.map(c => {
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

    return res.status(200).json({ campaigns: merged, updated: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
