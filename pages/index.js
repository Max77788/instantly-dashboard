import { useEffect, useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CHART_COLORS = {
  sent: '#4facfe',
  opens: '#43e97b',
  clicks: '#f093fb',
  replies: '#667eea',
  opportunities: '#fa709a',
};

function MetricCard({ label, value, sub, gradient }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 16,
      padding: '18px 24px',
      border: '0.5px solid rgba(255,255,255,0.08)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: gradient,
      }} />
      <div style={{ fontSize: 10, color: '#777', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: '#f0f0f0', letterSpacing: '-0.02em' }}>{value}</div>
      {sub != null && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Shimmer() {
  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: 8,
      height: 16,
      width: '100%',
    }} />
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '0.5px solid rgba(255,255,255,0.06)',
      borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem',
    }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: '#888',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 12,
      }}>{title}</div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const stats = data?.stats;
  const daily = data?.daily || [];
  const campaignCount = data?.campaignCount || 0;

  // Aggregate daily data for charts
  const dailyAggregated = useMemo(() => {
    const map = {};
    daily.forEach(d => {
      if (!map[d.date]) {
        map[d.date] = { date: d.date, sent: 0, opens: 0, clicks: 0, replies: 0, opportunities: 0 };
      }
      map[d.date].sent += d.sent || 0;
      map[d.date].opens += d.unique_opened || 0;
      map[d.date].clicks += d.unique_clicks || 0;
      map[d.date].replies += d.unique_replies || 0;
      map[d.date].opportunities += d.unique_opportunities || 0;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [daily]);

  // Helper to format rates
  const pct = (num, denom) => denom > 0 ? (num / denom * 100).toFixed(1) + '%' : '0.0%';

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const fmt = (n) => n != null ? n.toLocaleString() : '0';

  return (
    <>
      <Head>
        <title>AI FusionIQ Labs — Campaign Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <div style={{
        fontFamily: "'Inter', -apple-system, sans-serif",
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #0a0a0f 0%, #111119 30%, #0d0d18 60%, #0a0a0f 100%)',
        color: '#e0e0e0',
        padding: '2.5rem 1.5rem',
      }}>
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '2.5rem', flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(102,126,234,0.3)',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: '#999',
                  letterSpacing: '0.1em', textTransform: 'uppercase'
                }}>AI FusionIQ Labs</span>
              </div>
              <h1 style={{
                fontSize: 26, fontWeight: 700, margin: 0,
                background: 'linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #a0a0c0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}>Campaign Analytics</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 13, color: '#666' }}>{campaignCount} active {campaignCount === 1 ? 'campaign' : 'campaigns'}</span>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(67,233,123,0.08)',
                border: '0.5px solid rgba(67,233,123,0.15)',
                borderRadius: 999, padding: '8px 16px',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#43e97b',
                  boxShadow: '0 0 8px #43e97b', animation: 'pulse 2s infinite',
                }} />
                <span style={{ fontSize: 12, color: '#43e97b', fontWeight: 600 }}>Live</span>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '0.5px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '20px 24px',
                }}>
                  <Shimmer />
                  <div style={{ height: 8 }} />
                  <div style={{ width: '60%' }}><Shimmer /></div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(255,80,80,0.08)', border: '0.5px solid rgba(255,80,80,0.2)',
              borderRadius: 12, padding: '1rem 1.25rem', color: '#ff6b6b', fontSize: 13,
              marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}. Check that INSTANTLY_API_KEY is set.
            </div>
          )}

          {/* Empty */}
          {!loading && !error && !stats && (
            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 1.5rem',
                background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#999', marginBottom: 6 }}>No active campaigns</div>
              <div style={{ fontSize: 13, color: '#555' }}>Launch a campaign in Instantly to see analytics here.</div>
            </div>
          )}

          {!loading && stats && (
            <>
              {/* Sending Metrics */}
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#555',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 10, marginTop: 0,
              }}>Sending</div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 10, marginBottom: '1.5rem',
              }}>
                <MetricCard label="Emails Sent" value={fmt(stats.emailsSent)} sub={`${fmt(stats.contacted)} contacted`} gradient="linear-gradient(135deg, #667eea, #764ba2)" />
                <MetricCard label="New Leads" value={fmt(stats.newLeadsContacted)} gradient="linear-gradient(135deg, #4facfe, #00f2fe)" />
                <MetricCard label="Completed" value={fmt(stats.completed)} sub={stats.emailsSent > 0 ? pct(stats.completed, stats.emailsSent) + ' of sent' : null} gradient="linear-gradient(135deg, #43e97b, #38f9d7)" />
                <MetricCard label="Bounced" value={fmt(stats.bounced)} sub={stats.emailsSent > 0 ? pct(stats.bounced, stats.emailsSent) + ' bounce rate' : null} gradient="linear-gradient(135deg, #fa709a, #fee140)" />
                <MetricCard label="Unsubscribed" value={fmt(stats.unsubscribed)} gradient="linear-gradient(135deg, #f093fb, #f5576c)" />
              </div>

              {/* Engagement Metrics */}
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#555',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 10,
              }}>Engagement</div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 10, marginBottom: '1.5rem',
              }}>
                <MetricCard label="Opens (Total)" value={fmt(stats.openCount)} sub={stats.emailsSent > 0 ? pct(stats.openUnique, stats.emailsSent) + ' unique rate' : null} gradient="linear-gradient(135deg, #43e97b, #38f9d7)" />
                <MetricCard label="Unique Opens" value={fmt(stats.openUnique)} gradient="linear-gradient(135deg, #667eea, #764ba2)" />
                <MetricCard label="Clicks (Total)" value={fmt(stats.clickCount)} sub={stats.emailsSent > 0 ? pct(stats.clickUnique, stats.emailsSent) + ' unique rate' : null} gradient="linear-gradient(135deg, #f093fb, #f5576c)" />
                <MetricCard label="Unique Clicks" value={fmt(stats.clickUnique)} gradient="linear-gradient(135deg, #4facfe, #00f2fe)" />
              </div>

              {/* Response Metrics */}
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#555',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 10,
              }}>Responses</div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 10, marginBottom: '1.5rem',
              }}>
                <MetricCard label="Total Replies" value={fmt(stats.replyCount)} sub={stats.emailsSent > 0 ? pct(stats.replyUnique, stats.emailsSent) + ' unique rate' : null} gradient="linear-gradient(135deg, #667eea, #764ba2)" />
                <MetricCard label="Unique Replies" value={fmt(stats.replyUnique)} gradient="linear-gradient(135deg, #43e97b, #38f9d7)" />
                <MetricCard label="Auto Replies" value={fmt(stats.replyAutomatic)} sub={stats.replyAutomaticUnique != null ? fmt(stats.replyAutomaticUnique) + ' unique' : null} gradient="linear-gradient(135deg, #fa709a, #fee140)" />
              </div>

              {/* Pipeline Metrics */}
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#555',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 10,
              }}>Pipeline</div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 10, marginBottom: '1.5rem',
              }}>
                <MetricCard label="Opportunities" value={fmt(stats.opportunities)} sub={stats.opportunityValue > 0 ? '$' + fmt(stats.opportunityValue) + ' value' : null} gradient="linear-gradient(135deg, #43e97b, #38f9d7)" />
                <MetricCard label="Interested" value={fmt(stats.interested)} gradient="linear-gradient(135deg, #4facfe, #00f2fe)" />
                <MetricCard label="Meetings Booked" value={fmt(stats.meetingsBooked)} gradient="linear-gradient(135deg, #667eea, #764ba2)" />
                <MetricCard label="Meetings Done" value={fmt(stats.meetingsCompleted)} gradient="linear-gradient(135deg, #f093fb, #f5576c)" />
                <MetricCard label="Closed" value={fmt(stats.closed)} gradient="linear-gradient(135deg, #fa709a, #fee140)" />
              </div>

              {/* Chart 1 — Sending & Engagement (daily) */}
              {dailyAggregated.length > 0 && (
                <ChartCard title="Daily Activity · Last 30 Days">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyAggregated} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <defs>
                        {Object.entries(CHART_COLORS).map(([key, color]) => (
                          <linearGradient key={key} id={`fill_${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#555' }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                        tickFormatter={v => {
                          const d = new Date(v + 'T00:00:00');
                          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} width={48} />
                      <Tooltip
                        contentStyle={{
                          background: '#1a1a24',
                          border: '0.5px solid rgba(255,255,255,0.1)',
                          borderRadius: 10,
                          fontSize: 12,
                          color: '#ddd',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        }}
                        labelFormatter={v => {
                          const d = new Date(v + 'T00:00:00');
                          return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, color: '#888', paddingTop: 10 }} iconType="plainline" />
                      {[
                        { key: 'sent', name: 'Sent', color: CHART_COLORS.sent },
                        { key: 'opens', name: 'Unique Opens', color: CHART_COLORS.opens },
                        { key: 'clicks', name: 'Unique Clicks', color: CHART_COLORS.clicks },
                        { key: 'replies', name: 'Unique Replies', color: CHART_COLORS.replies },
                        { key: 'opportunities', name: 'Opportunities', color: CHART_COLORS.opportunities },
                      ].map(s => (
                        <Line
                          key={s.key}
                          type="monotone"
                          dataKey={s.key}
                          name={s.name}
                          stroke={s.color}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
                          fill={`url(#fill_${s.key})`}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Chart 2 — Pipeline funnel (daily) */}
              {dailyAggregated.length > 0 && (
                <ChartCard title="Pipeline Activity · Last 30 Days">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={dailyAggregated} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#555' }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                        tickFormatter={v => {
                          const d = new Date(v + 'T00:00:00');
                          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} width={48} />
                      <Tooltip
                        contentStyle={{
                          background: '#1a1a24',
                          border: '0.5px solid rgba(255,255,255,0.1)',
                          borderRadius: 10,
                          fontSize: 12,
                          color: '#ddd',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        }}
                        labelFormatter={v => {
                          const d = new Date(v + 'T00:00:00');
                          return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, color: '#888', paddingTop: 10 }} iconType="plainline" />
                      {[
                        { key: 'replies', name: 'Replies', color: '#43e97b' },
                        { key: 'opportunities', name: 'Opportunities', color: '#f093fb' },
                      ].map(s => (
                        <Line
                          key={s.key}
                          type="monotone"
                          dataKey={s.key}
                          name={s.name}
                          stroke={s.color}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Share */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '0.5px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '1.25rem 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 14, flexWrap: 'wrap',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>Share dashboard</div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12, color: '#666',
                  background: 'rgba(0,0,0,0.3)',
                  border: '0.5px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, padding: '10px 14px',
                  flex: 1, minWidth: 220,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {typeof window !== 'undefined' ? window.location.href : ''}
                </div>
                <button onClick={copyLink} style={{
                  fontSize: 12, padding: '10px 18px', borderRadius: 8,
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  color: '#ccc', fontWeight: 500,
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#ccc'; }}
                >
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
                <button onClick={fetchData} style={{
                  fontSize: 12, padding: '10px 18px', borderRadius: 8,
                  border: '0.5px solid rgba(102,126,234,0.3)',
                  background: 'rgba(102,126,234,0.1)',
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  color: '#667eea', fontWeight: 600,
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(102,126,234,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(102,126,234,0.1)'; }}
                >
                  Refresh
                </button>
              </div>

              {lastUpdated && (
                <div style={{
                  fontSize: 11, color: '#444', textAlign: 'right', marginTop: '1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                  Updated {lastUpdated.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} · auto-refresh every 5 min
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #0a0a0f; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </>
  );
}
