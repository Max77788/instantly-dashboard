import { useEffect, useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

const GLOWS = [
  '0 0 20px rgba(102,126,234,0.3)',
  '0 0 20px rgba(240,147,251,0.3)',
  '0 0 20px rgba(79,172,254,0.3)',
  '0 0 20px rgba(67,233,123,0.3)',
  '0 0 20px rgba(250,112,154,0.3)',
  '0 0 20px rgba(161,140,209,0.3)',
];

function StatusBadge({ status }) {
  const map = {
    1: ['Active', 'rgba(67,233,123,0.15)', '#43e97b'],
    2: ['Paused', 'rgba(255,255,255,0.06)', '#888'],
    0: ['Draft', 'rgba(255,255,255,0.06)', '#888'],
    3: ['Completed', 'rgba(79,172,254,0.15)', '#4facfe'],
  };
  const [label, bg, color] = map[status] || ['Unknown', 'rgba(255,255,255,0.06)', '#888'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color,
      background: bg, padding: '3px 10px', borderRadius: 999, fontWeight: 500,
      border: `0.5px solid ${color}33`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
      {label}
    </span>
  );
}

function MetricCard({ label, value, sub, gradient, glow }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 16,
      padding: '20px 24px',
      border: '0.5px solid rgba(255,255,255,0.08)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: gradient,
      }} />
      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 500 }}>{label}</div>
      <div style={{
        fontSize: 32, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em',
        textShadow: glow,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{sub}</div>}
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

  const campaigns = data?.campaigns || [];
  const daily = data?.daily || [];
  const totSent = campaigns.reduce((a, c) => a + c.sent, 0);
  const totReplies = campaigns.reduce((a, c) => a + c.replies, 0);
  const totLeads = campaigns.reduce((a, c) => a + c.leads, 0);
  const totOpp = campaigns.reduce((a, c) => a + c.opportunities, 0);
  const replyRate = totSent > 0 ? (totReplies / totSent * 100).toFixed(1) : '0.0';
  const maxSent = Math.max(...campaigns.map(c => c.sent), 1);

  // Aggregate daily analytics across all campaigns
  const dailyAggregated = useMemo(() => {
    const map = {};
    daily.forEach(d => {
      if (!map[d.date]) map[d.date] = { date: d.date, sent: 0, opens: 0, replies: 0, opportunities: 0 };
      map[d.date].sent += d.sent || 0;
      map[d.date].opens += d.unique_opened || 0;
      map[d.date].replies += d.unique_replies || 0;
      map[d.date].opportunities += d.unique_opportunities || 0;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [daily]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

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
              }}>Active Campaigns</h1>
            </div>
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

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '0.5px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '20px 24px',
                }}>
                  <Shimmer />
                  <div style={{ height: 12 }} />
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
              marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}. Check that INSTANTLY_API_KEY is set.
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && campaigns.length === 0 && (
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
              <div style={{ fontSize: 13, color: '#555' }}>Launch a campaign in Instantly to see it here.</div>
            </div>
          )}

          {!loading && campaigns.length > 0 && (
            <>
              {/* Summary metrics */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12, marginBottom: '1.5rem',
              }}>
                <MetricCard label="Total Leads" value={totLeads.toLocaleString()} sub="Across active campaigns" gradient={GRADIENTS[0]} glow={GLOWS[0]} />
                <MetricCard label="Emails Sent" value={totSent.toLocaleString()} sub="All time" gradient={GRADIENTS[1]} glow={GLOWS[1]} />
                <MetricCard label="Total Replies" value={totReplies} sub={`${replyRate}% reply rate`} gradient={GRADIENTS[2]} glow={GLOWS[2]} />
                <MetricCard label="Opportunities" value={totOpp} sub="In pipeline" gradient={GRADIENTS[3]} glow={GLOWS[3]} />
              </div>

              {/* Daily trends chart */}
              {dailyAggregated.length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '0.5px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem',
                }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#888',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: 8,
                  }}>Daily Trends · Last 30 Days</div>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={dailyAggregated} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <defs>
                        <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4facfe" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#4facfe" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fillOpens" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#43e97b" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#43e97b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fillReplies" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#667eea" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#667eea" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fillOpps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f093fb" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#f093fb" stopOpacity={0} />
                        </linearGradient>
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
                      <YAxis
                        tick={{ fontSize: 11, fill: '#555' }}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                      />
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
                      <Legend
                        wrapperStyle={{ fontSize: 12, color: '#888', paddingTop: 12 }}
                        iconType="plainline"
                      />
                      <Line
                        type="monotone"
                        dataKey="sent"
                        name="Emails Sent"
                        stroke="#4facfe"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#4facfe', stroke: '#fff', strokeWidth: 2 }}
                        fill="url(#fillSent)"
                      />
                      <Line
                        type="monotone"
                        dataKey="opens"
                        name="Opens"
                        stroke="#43e97b"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#43e97b', stroke: '#fff', strokeWidth: 2 }}
                        fill="url(#fillOpens)"
                      />
                      <Line
                        type="monotone"
                        dataKey="replies"
                        name="Replies"
                        stroke="#667eea"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#667eea', stroke: '#fff', strokeWidth: 2 }}
                        fill="url(#fillReplies)"
                      />
                      <Line
                        type="monotone"
                        dataKey="opportunities"
                        name="Opportunities"
                        stroke="#f093fb"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#f093fb', stroke: '#fff', strokeWidth: 2 }}
                        fill="url(#fillOpps)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Campaign cards */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 14, marginBottom: '1.5rem',
              }}>
                {campaigns.map((c, i) => {
                  const gradient = GRADIENTS[i % GRADIENTS.length];
                  const glow = GLOWS[i % GLOWS.length];
                  const rr = c.sent > 0 ? (c.replies / c.sent * 100).toFixed(1) : '0.0';
                  return (
                    <div key={c.id} style={{
                      background: 'rgba(255,255,255,0.02)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '0.5px solid rgba(255,255,255,0.06)',
                      borderRadius: 16,
                      padding: '1.5rem',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'default',
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = glow;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                        background: gradient,
                      }} />
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', marginBottom: 16,
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, flex: 1, marginRight: 8, color: '#ddd' }}>{c.name}</div>
                        <StatusBadge status={c.status} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        {[
                          ['Leads', c.leads.toLocaleString()],
                          ['Sent', c.sent.toLocaleString()],
                          ['Replies', c.replies],
                          ['Bounced', c.bounced],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2, fontWeight: 500 }}>{k}</div>
                            <div style={{ fontSize: 20, fontWeight: 600, color: '#eee' }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginBottom: 6 }}>
                          <span>Send progress</span>
                          <span style={{
                            background: `rgba(255,255,255,0.04)`,
                            padding: '2px 8px', borderRadius: 999, fontSize: 11,
                            color: '#aaa', fontWeight: 500,
                          }}>{rr}% replies</span>
                        </div>
                        <div style={{
                          background: 'rgba(255,255,255,0.06)',
                          borderRadius: 999, height: 5, width: '100%', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: 5, borderRadius: 999,
                            background: gradient,
                            width: `${maxSent > 0 ? Math.round((c.sent / maxSent) * 100) : 0}%`,
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                      </div>
                      {c.opportunities > 0 && (
                        <div style={{
                          marginTop: 14, borderRadius: 8, padding: '8px 12px',
                          background: 'rgba(67,233,123,0.06)',
                          border: '0.5px solid rgba(67,233,123,0.1)',
                          fontSize: 12, color: '#43e97b',
                          display: 'flex', justifyContent: 'space-between',
                          fontWeight: 500,
                        }}>
                          <span>Opportunities</span>
                          <span>{c.opportunities}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Detailed table */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '0.5px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem',
                overflowX: 'auto',
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: '#888',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 16,
                }}>Campaign Breakdown</div>
                <table style={{
                  width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600,
                }}>
                  <thead>
                    <tr>
                      {['Campaign', 'Leads', 'Sent', 'Contacted', 'Replies', 'Reply %', 'Bounced', 'Opp.'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '10px 8px',
                          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                          fontSize: 10, color: '#555', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c, i) => {
                      const gradient = GRADIENTS[i % GRADIENTS.length];
                      const rr = c.sent > 0 ? (c.replies / c.sent * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={c.id} style={{
                          transition: 'background 0.15s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 8px', borderBottom: '0.5px solid rgba(255,255,255,0.04)', fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 8, height: 8, borderRadius: 3,
                                background: gradient, flexShrink: 0,
                              }} />
                              <span style={{ fontSize: 13, color: '#ccc' }}>{c.name}</span>
                            </div>
                          </td>
                          {[c.leads.toLocaleString(), c.sent.toLocaleString(), c.contacted.toLocaleString(), c.replies, `${rr}%`, c.bounced, c.opportunities].map((v, j) => (
                            <td key={j} style={{
                              padding: '12px 8px',
                              borderBottom: '0.5px solid rgba(255,255,255,0.04)',
                              color: '#999', fontSize: 13,
                              fontFamily: j < 3 ? "'JetBrains Mono', monospace" : 'inherit',
                            }}>{v}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Share section */}
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
