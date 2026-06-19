export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  try {
    const apiKey = process.env.INSTANTLY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
    }

    const headers = { Authorization: `Bearer ${apiKey}` };

    // 1. Fetch all campaigns (active + paused)
    const listRes = await fetch(
      'https://api.instantly.ai/api/v2/campaigns?limit=100',
      { headers }
    );

    if (!listRes.ok) {
      const text = await listRes.text();
      return res.status(502).json({ error: `Campaigns API error (${listRes.status})` });
    }

    const listData = await listRes.json();
    const allCampaigns = listData.items || [];

    // Filter to Sunita campaigns (SHI prefix or Sunita in name)
    const campaigns = allCampaigns.filter(c => {
      const name = (c.name || '').toUpperCase();
      return name.includes('SUNIT') || name.includes('SHI');
    });

    if (campaigns.length === 0) {
      // No filter matched — fall back to all active campaigns
      const active = allCampaigns.filter(c => c.status === 1);
      if (active.length === 0) {
        return res.status(200).json({ stats: null, daily: [], segments: [], updated: new Date().toISOString() });
      }
      campaigns.push(...active);
    }

    const ids = campaigns.map(c => c.id);

    // 2. Fetch per-campaign analytics via individual GET calls (POST summary endpoint is dead as of June 2026)
    let analyticsArr = [];

    if (ids.length > 0) {
      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const r = await fetch(
                `https://api.instantly.ai/api/v2/campaigns/analytics?id=${encodeURIComponent(id)}`,
                { headers }
              );
              if (r.ok) {
                const d = await r.json();
                return Array.isArray(d) ? d : [d];
              }
              return [];
            } catch { return []; }
          })
        );
        analyticsArr = results.flat();
      } catch {}
    }

    // 3. Build segments and aggregate stats
    const segments = campaigns.map(c => {
      const a = analyticsArr.find(x => x.campaign_id === c.id) || {};
      const opp = a.total_opportunities || 0;
      const sent = a.emails_sent_count || 0;
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        leads: a.leads_count || 0,
        sent,
        contacted: a.contacted_count || 0,
        replies: a.reply_count || 0,
        bounced: a.bounced_count || 0,
        opportunities: opp,
        replyPct: sent > 0 ? ((opp / sent) * 100).toFixed(1) : '0.0',
      };
    });

    const sum = (key) => analyticsArr.reduce((a, x) => a + (x[key] || 0), 0);
    const stats = {
      emailsSent: sum('emails_sent_count'),
      contacted: sum('contacted_count'),
      newLeadsContacted: sum('new_leads_contacted_count'),
      openCount: sum('open_count'),
      openUnique: sum('open_count_unique'),
      clickCount: sum('link_click_count'),
      clickUnique: sum('link_click_count_unique'),
      replyCount: sum('reply_count'),
      replyUnique: sum('reply_count_unique'),
      replyAutomatic: sum('reply_count_automatic'),
      replyAutomaticUnique: sum('reply_count_automatic_unique'),
      bounced: sum('bounced_count'),
      unsubscribed: sum('unsubscribed_count'),
      completed: sum('completed_count'),
      opportunities: sum('total_opportunities'),
      opportunityValue: sum('total_opportunity_value'),
      interested: sum('total_interested'),
      meetingsBooked: sum('total_meeting_booked'),
      meetingsCompleted: sum('total_meeting_completed'),
      closed: sum('total_closed'),
    };

    // 4. Fetch daily analytics
    const days = parseInt(req.query.days, 10) || 7;
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

    let daily = [];
    try {
      const dailyRes = await fetch(
        `https://api.instantly.ai/api/v2/campaigns/analytics/daily?start_date=${startDate}&end_date=${endDate}`,
        { headers }
      );
      if (dailyRes.ok) {
        const dailyData = await dailyRes.json();
        daily = Array.isArray(dailyData) ? dailyData : [];
      }
    } catch {}

    return res.status(200).json({
      stats,
      daily,
      segments,
      updated: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
