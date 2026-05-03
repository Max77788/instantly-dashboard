import { useEffect, useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ── Brand ──
const BRAND = {
  primary: '#4f46e5',    // indigo
  primaryLight: '#eef2ff',
  green: '#10b981',
  greenBg: '#ecfdf5',
  red: '#ef4444',
  redBg: '#fef2f2',
  amber: '#f59e0b',
  amberBg: '#fffbeb',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',
};

// ── Sub-components ──
function KTile({ label, value, sub }) {
  return (
    <div style={{ background: '#fff', border: `0.5px solid ${BRAND.gray200}`, borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: BRAND.gray400, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: BRAND.gray900 }}>{value}</div>
      {sub != null && <div style={{ fontSize: 12, color: BRAND.gray400, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function KPI({ label, current, target, format }) {
  const met = current >= target;
  const pctFmt = (v) => format === 'pct' ? (v * 100).toFixed(1) + '%' : v.toLocaleString();
  const barPct = target > 0 ? Math.min(current / target * 100, 100) : 0;
  return (
    <div style={{ background: '#fff', border: `0.5px solid ${BRAND.gray200}`, borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.gray700, marginBottom: 14 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: BRAND.gray900, lineHeight: 1 }}>{pctFmt(current)}</span>
        <span style={{ fontSize: 14, color: BRAND.gray400, marginBottom: 4 }}>/ target {pctFmt(target)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
          background: met ? BRAND.greenBg : BRAND.redBg,
          color: met ? BRAND.green : BRAND.red,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: met ? BRAND.green : BRAND.red }} />
          {met ? 'On track' : 'Below target'}
        </span>
      </div>
      <div style={{ background: BRAND.gray100, borderRadius: 999, height: 6, overflow: 'hidden' }}>
        <div style={{
          height: 6, borderRadius: 999,
          width: `${barPct}%`,
          background: met ? `linear-gradient(90deg, ${BRAND.green}, #34d399)` : `linear-gradient(90deg, ${BRAND.amber}, #fbbf24)`,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

function ReplyPill({ label, count, color, bg }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: bg, borderRadius: 999, padding: '6px 14px',
      fontSize: 12, fontWeight: 500, color,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
      {label}: <strong>{count.toLocaleString()}</strong>
    </div>
  );
}

// ── Main ──
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [days, setDays] = useState(7);

  const fetchData = useCallback(async (d) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/campaigns?days=${d}`);
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
    fetchData(days);
    const interval = setInterval(() => fetchData(days), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [days, fetchData]);

  const stats = data?.stats;
  const daily = data?.daily || [];

  const dailyAgg = useMemo(() => {
    const map = {};
    daily.forEach(d => {
      const key = d.date;
      if (!map[key]) map[key] = { date: key, contacted: 0 };
      map[key].contacted += d.contacted || 0;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [daily]);

  const fmt = (n) => n != null ? n.toLocaleString() : '0';
  const pct = (n, d) => d > 0 ? (n / d * 100).toFixed(1) + '%' : '0%';

  // Derived metrics
  const positiveReplies = stats?.opportunities || 0;
  const autoReplies = stats?.replyAutomatic || 0;
  const totalReplies = stats?.replyCount || 0;
  const negativeReplies = Math.max(0, totalReplies - positiveReplies - autoReplies);
  const noResponse = Math.max(0, (stats?.contacted || 0) - (stats?.replyUnique || 0));
  const positiveReplyRate = stats?.emailsSent > 0 ? positiveReplies / stats.emailsSent : 0;
  const bookedCallRate = positiveReplies > 0 ? (stats?.meetingsBooked || 0) / positiveReplies : 0;

  return (
    <>
      <Head>
        <title>AI FusionIQ Labs — Sunita Campaign Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <div style={{
        fontFamily: "'Inter', -apple-system, sans-serif",
        minHeight: '100vh',
        background: BRAND.gray50,
        color: BRAND.gray900,
        padding: '2rem 1.5rem',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '2rem', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.gray400, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                AI FusionIQ Labs
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: BRAND.gray900 }}>
                Sunita Campaign • <span style={{ fontWeight: 400, color: BRAND.gray400 }}>Analytics</span>
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: BRAND.green, animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: BRAND.green }}>Live</span>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              background: BRAND.redBg, border: `0.5px solid ${BRAND.red}33`, borderRadius: 10,
              padding: '12px 16px', color: BRAND.red, fontSize: 13, marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}. Check INSTANTLY_API_KEY.
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && !error && !stats && (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: BRAND.gray400 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No active campaigns</div>
              <div style={{ fontSize: 13 }}>Launch a campaign in Instantly to see analytics here.</div>
            </div>
          )}

          {!loading && stats && (
            <>
              {/* ═══════ SECTION 1 — Contacted Leads Chart ═══════ */}
              <div style={{
                background: '#fff', border: `0.5px solid ${BRAND.gray200}`,
                borderRadius: 14, padding: '20px 24px', marginBottom: '1.25rem',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 4, flexWrap: 'wrap', gap: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.gray700 }}>Leads Contacted</div>
                    <div style={{ fontSize: 11, color: BRAND.gray400 }}>Daily unique leads contacted over time</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[7, 14, 30].map(d => (
                      <button key={d} onClick={() => setDays(d)} style={{
                        fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6,
                        border: days === d ? `1px solid ${BRAND.primary}` : `0.5px solid ${BRAND.gray200}`,
                        background: days === d ? BRAND.primaryLight : '#fff',
                        color: days === d ? BRAND.primary : BRAND.gray500,
                        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      }}>{d}D</button>
                    ))}
                  </div>
                </div>
                {dailyAgg.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={dailyAgg} margin={{ top: 12, right: 8, left: 4, bottom: 4 }}>
                      <defs>
                        <linearGradient id="fillContacted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={BRAND.primary} stopOpacity={0.12} />
                          <stop offset="100%" stopColor={BRAND.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={BRAND.gray100} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: BRAND.gray400 }}
                        tickLine={false}
                        axisLine={{ stroke: BRAND.gray200 }}
                        tickFormatter={v => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 11, fill: BRAND.gray400 }} tickLine={false} axisLine={false} width={40} />
                      <Tooltip
                        contentStyle={{
                          background: '#fff', border: `0.5px solid ${BRAND.gray200}`,
                          borderRadius: 8, fontSize: 12, color: BRAND.gray900,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                        }}
                        labelFormatter={v => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                      />
                      <Line
                        type="monotone"
                        dataKey="contacted"
                        name="Contacted"
                        stroke={BRAND.primary}
                        strokeWidth={2}
                        dot={{ r: 3, fill: BRAND.primary, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: BRAND.primary, stroke: '#fff', strokeWidth: 2 }}
                        fill="url(#fillContacted)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: BRAND.gray400, fontSize: 13 }}>No daily data yet.</div>
                )}
              </div>

              {/* ═══════ SECTION 2 — Campaign Send Table ═══════ */}
              <div style={{
                background: '#fff', border: `0.5px solid ${BRAND.gray200}`,
                borderRadius: 14, padding: '20px 24px', marginBottom: '1.25rem',
                overflowX: 'auto',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.gray700, marginBottom: 14 }}>
                  Campaign Send Summary
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 500 }}>
                  <thead>
                    <tr>
                      {['Leads', 'Sent', 'Replies', 'Bounced', 'OPP', '% Replied'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '8px 12px',
                          borderBottom: `1px solid ${BRAND.gray100}`,
                          fontSize: 11, color: BRAND.gray400, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '14px 12px', borderBottom: `0.5px solid ${BRAND.gray50}`, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmt(stats.contacted)}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: `0.5px solid ${BRAND.gray50}`, fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmt(stats.emailsSent)}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: `0.5px solid ${BRAND.gray50}`, fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmt(totalReplies)}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: `0.5px solid ${BRAND.gray50}`, fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmt(stats.bounced)}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: `0.5px solid ${BRAND.gray50}`, color: BRAND.green, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmt(positiveReplies)}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: `0.5px solid ${BRAND.gray50}`, fontWeight: 600, color: BRAND.primary, fontFamily: "'JetBrains Mono', monospace" }}>
                        {pct(positiveReplies, stats.emailsSent)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Reply classification row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                  marginTop: 16, paddingTop: 14,
                  borderTop: `0.5px solid ${BRAND.gray100}`,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: BRAND.gray400, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>
                    Reply Breakdown
                  </span>
                  <ReplyPill label="Positive" count={positiveReplies} color={BRAND.green} bg={BRAND.greenBg} />
                  <ReplyPill label="Negative" count={negativeReplies} color={BRAND.red} bg={BRAND.redBg} />
                  <ReplyPill label="Auto" count={autoReplies} color={BRAND.amber} bg={BRAND.amberBg} />
                  <ReplyPill label="No response" count={noResponse} color={BRAND.gray400} bg={BRAND.gray100} />
                </div>
              </div>

              {/* ═══════ SECTION 3 — KPI Cards ═══════ */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 14, marginBottom: '1.25rem',
              }}>
                <KPI
                  label="Positive Reply Rate"
                  current={positiveReplyRate}
                  target={0.02}
                  format="pct"
                />
                <KPI
                  label="Booked Call Rate"
                  current={bookedCallRate}
                  target={0.25}
                  format="pct"
                />
              </div>

              {/* KPI descriptions */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 14, marginBottom: '1.25rem',
              }}>
                <div style={{ background: '#fff', border: `0.5px solid ${BRAND.gray200}`, borderRadius: 12, padding: '14px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: BRAND.gray400, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    Formula
                  </div>
                  <div style={{ fontSize: 13, color: BRAND.gray700, lineHeight: 1.5 }}>
                    Positive replies <span style={{ color: BRAND.gray400 }}>÷</span> Total emails sent<br />
                    <span style={{ fontSize: 11, color: BRAND.gray400 }}>Excludes auto-replies &amp; negative replies. Positive = expressed interest / opportunity.</span>
                  </div>
                </div>
                <div style={{ background: '#fff', border: `0.5px solid ${BRAND.gray200}`, borderRadius: 12, padding: '14px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: BRAND.gray400, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    Formula
                  </div>
                  <div style={{ fontSize: 13, color: BRAND.gray700, lineHeight: 1.5 }}>
                    Booked calls <span style={{ color: BRAND.gray400 }}>÷</span> Positive replies<br />
                    <span style={{ fontSize: 11, color: BRAND.gray400 }}>Connected to Microsoft Bookings calendar. Booked = meetings booked in Instantly.</span>
                  </div>
                </div>
              </div>

              {/* ── Footer ── */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: 10,
              }}>
                {lastUpdated && (
                  <div style={{ fontSize: 12, color: BRAND.gray400, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                    Updated {lastUpdated.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} · auto-refresh every 5 min
                  </div>
                )}
                <button onClick={() => fetchData(days)} style={{
                  fontSize: 12, padding: '8px 16px', borderRadius: 6,
                  border: `0.5px solid ${BRAND.primary}33`,
                  background: BRAND.primaryLight,
                  color: BRAND.primary, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}>Refresh</button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${BRAND.gray50}; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
      `}</style>
    </>
  );
}
