import { useEffect, useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ── Theme tokens ──
const LIGHT = {
  primary: '#4f46e5',
  primaryLight: '#eef2ff',
  green: '#10b981',
  greenBg: '#ecfdf5',
  red: '#ef4444',
  redBg: '#fef2f2',
  amber: '#f59e0b',
  amberBg: '#fffbeb',
  bg: '#f9fafb',
  surface: '#fff',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  textHeading: '#111827',
  textBody: '#374151',
  textMuted: '#9ca3af',
  textFaint: '#d1d5db',
  chartGrid: '#f3f4f6',
  chartAxis: '#e5e7eb',
  chartTick: '#9ca3af',
  tooltipBg: '#fff',
  tooltipBorder: '#e5e7eb',
  tooltipText: '#111827',
  tooltipShadow: '0 4px 16px rgba(0,0,0,0.06)',
  toggleBg: '#e5e7eb',
  toggleDot: '#fff',
  bodyBg: '#f9fafb',
  timeBtnBg: '#fff',
  timeBtnBorder: '#e5e7eb',
  timeBtnText: '#6b7280',
  labelMuted: '#9ca3af',
  kpiCardBg: '#fff',
  kpiCardBorder: '#e5e7eb',
};

const DARK = {
  primary: '#818cf8',
  primaryLight: 'rgba(99,102,241,0.15)',
  green: '#34d399',
  greenBg: 'rgba(52,211,153,0.12)',
  red: '#f87171',
  redBg: 'rgba(248,113,113,0.12)',
  amber: '#fbbf24',
  amberBg: 'rgba(251,191,36,0.12)',
  bg: '#0a0a0f',
  surface: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.04)',
  textHeading: '#f0f0f0',
  textBody: '#ccc',
  textMuted: '#888',
  textFaint: '#555',
  chartGrid: 'rgba(255,255,255,0.04)',
  chartAxis: 'rgba(255,255,255,0.06)',
  chartTick: '#555',
  tooltipBg: '#1a1a24',
  tooltipBorder: 'rgba(255,255,255,0.1)',
  tooltipText: '#ddd',
  tooltipShadow: '0 8px 32px rgba(0,0,0,0.4)',
  toggleBg: 'rgba(255,255,255,0.08)',
  toggleDot: '#818cf8',
  bodyBg: '#0a0a0f',
  timeBtnBg: 'transparent',
  timeBtnBorder: 'rgba(255,255,255,0.08)',
  timeBtnText: '#888',
  labelMuted: '#555',
  kpiCardBg: 'rgba(255,255,255,0.03)',
  kpiCardBorder: 'rgba(255,255,255,0.08)',
};

// ── Sub-components ──
function KPI({ label, current, target, format, t }) {
  const met = current >= target;
  const val = format === 'pct' ? (current * 100).toFixed(1) + '%' : current.toLocaleString();
  const tgt = format === 'pct' ? (target * 100).toFixed(1) + '%' : target.toLocaleString();
  const barPct = target > 0 ? Math.min(current / target * 100, 100) : 0;
  return (
    <div style={{ background: t.kpiCardBg, border: `0.5px solid ${t.kpiCardBorder}`, borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: t.textBody, marginBottom: 14 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: t.textHeading, lineHeight: 1 }}>{val}</span>
        <span style={{ fontSize: 14, color: t.textMuted, marginBottom: 4 }}>/ target {tgt}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
          background: met ? t.greenBg : t.redBg,
          color: met ? t.green : t.red,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: met ? t.green : t.red }} />
          {met ? 'On track' : 'Below target'}
        </span>
      </div>
      <div style={{ background: t.borderLight, borderRadius: 999, height: 6, overflow: 'hidden' }}>
        <div style={{
          height: 6, borderRadius: 999,
          width: `${barPct}%`,
          background: met ? `linear-gradient(90deg, ${t.green}, #34d399)` : `linear-gradient(90deg, ${t.amber}, #fbbf24)`,
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
  const [dark, setDark] = useState(false);

  const t = dark ? DARK : LIGHT;

  const toggleTheme = () => setDark(!dark);

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
      if (!map[d.date]) map[d.date] = { date: d.date, contacted: 0 };
      map[d.date].contacted += d.contacted || 0;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [daily]);

  const fmt = (n) => n != null ? n.toLocaleString() : '0';
  const pct = (n, d) => d > 0 ? (n / d * 100).toFixed(1) + '%' : '0%';

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
        background: t.bg,
        color: t.textBody,
        padding: '2rem 1.5rem',
        transition: 'background 0.3s, color 0.3s',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '2rem', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                AI FusionIQ Labs
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: t.textHeading }}>
                Sunita Campaign • <span style={{ fontWeight: 400, color: t.textMuted }}>Analytics</span>
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Theme toggle */}
              <button onClick={toggleTheme} title={dark ? 'Light mode' : 'Dark mode'} style={{
                width: 44, height: 24, borderRadius: 12,
                background: t.toggleBg,
                border: 'none', cursor: 'pointer',
                position: 'relative',
                padding: 0,
                transition: 'background 0.2s',
              }}>
                <span style={{
                  position: 'absolute', top: 3, left: dark ? 23 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: t.toggleDot,
                  transition: 'left 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, lineHeight: 1,
                }}>
                  {dark ? '☀️' : '🌙'}
                </span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.green, animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: t.green }}>Live</span>
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              background: t.redBg, border: `0.5px solid ${t.red}33`, borderRadius: 10,
              padding: '12px 16px', color: t.red, fontSize: 13, marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}. Check INSTANTLY_API_KEY.
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && !error && !stats && (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: t.textMuted }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No active campaigns</div>
              <div style={{ fontSize: 13 }}>Launch a campaign in Instantly to see analytics here.</div>
            </div>
          )}

          {!loading && stats && (
            <>
              {/* ═══════ SECTION 1 — Contacted Leads Chart ═══════ */}
              <div style={{
                background: t.surface, border: `0.5px solid ${t.border}`,
                borderRadius: 14, padding: '20px 24px', marginBottom: '1.25rem',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 4, flexWrap: 'wrap', gap: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.textBody }}>Leads Contacted</div>
                    <div style={{ fontSize: 11, color: t.textMuted }}>Daily unique leads contacted over time</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[7, 14, 30].map(d => (
                      <button key={d} onClick={() => setDays(d)} style={{
                        fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6,
                        border: days === d ? `1px solid ${t.primary}` : `0.5px solid ${t.timeBtnBorder}`,
                        background: days === d ? t.primaryLight : t.timeBtnBg,
                        color: days === d ? t.primary : t.timeBtnText,
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
                          <stop offset="0%" stopColor={t.primary} stopOpacity={0.12} />
                          <stop offset="100%" stopColor={t.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.chartTick }} tickLine={false}
                        axisLine={{ stroke: t.chartAxis }}
                        tickFormatter={v => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11, fill: t.chartTick }} tickLine={false} axisLine={false} width={40} />
                      <Tooltip
                        contentStyle={{
                          background: t.tooltipBg, border: `0.5px solid ${t.tooltipBorder}`,
                          borderRadius: 8, fontSize: 12, color: t.tooltipText, boxShadow: t.tooltipShadow,
                        }}
                        labelFormatter={v => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                      />
                      <Line type="monotone" dataKey="contacted" name="Contacted"
                        stroke={t.primary} strokeWidth={2}
                        dot={{ r: 3, fill: t.primary, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: t.primary, stroke: '#fff', strokeWidth: 2 }}
                        fill="url(#fillContacted)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: t.textMuted, fontSize: 13 }}>No daily data yet.</div>
                )}
              </div>

              {/* ═══════ SECTION 2 — Campaign Send Table ═══════ */}
              <div style={{
                background: t.surface, border: `0.5px solid ${t.border}`,
                borderRadius: 14, padding: '20px 24px', marginBottom: '1.25rem',
                overflowX: 'auto',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.textBody, marginBottom: 14 }}>
                  Campaign Send Summary
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 500 }}>
                  <thead>
                    <tr>
                      {['Leads', 'Sent', 'Replies', 'Bounced', 'OPP', '% Replied'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '8px 12px',
                          borderBottom: `1px solid ${t.borderLight}`,
                          fontSize: 11, color: t.textMuted, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '14px 12px', borderBottom: `0.5px solid ${t.borderLight}`, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: t.textBody }}>
                        {fmt(stats.contacted)}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: `0.5px solid ${t.borderLight}`, fontFamily: "'JetBrains Mono', monospace", color: t.textBody }}>
                        {fmt(stats.emailsSent)}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: `0.5px solid ${t.borderLight}`, fontFamily: "'JetBrains Mono', monospace", color: t.textBody }}>
                        {fmt(totalReplies)}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: `0.5px solid ${t.borderLight}`, fontFamily: "'JetBrains Mono', monospace", color: t.textBody }}>
                        {fmt(stats.bounced)}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: `0.5px solid ${t.borderLight}`, color: t.green, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmt(positiveReplies)}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: `0.5px solid ${t.borderLight}`, fontWeight: 600, color: t.primary, fontFamily: "'JetBrains Mono', monospace" }}>
                        {pct(positiveReplies, stats.emailsSent)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                  marginTop: 16, paddingTop: 14,
                  borderTop: `0.5px solid ${t.borderLight}`,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>
                    Reply Breakdown
                  </span>
                  <ReplyPill label="Positive" count={positiveReplies} color={t.green} bg={t.greenBg} />
                  <ReplyPill label="Negative" count={negativeReplies} color={t.red} bg={t.redBg} />
                  <ReplyPill label="Auto" count={autoReplies} color={t.amber} bg={t.amberBg} />
                  <ReplyPill label="No response" count={noResponse} color={t.textMuted} bg={t.borderLight} />
                </div>
              </div>

              {/* ═══════ SECTION 3 — KPI Cards ═══════ */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 14, marginBottom: '1.25rem',
              }}>
                <KPI t={t} label="Positive Reply Rate" current={positiveReplyRate} target={0.02} format="pct" />
                <KPI t={t} label="Booked Call Rate" current={bookedCallRate} target={0.25} format="pct" />
              </div>

              {/* KPI formula descriptions */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 14, marginBottom: '1.25rem',
              }}>
                <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 12, padding: '14px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Formula</div>
                  <div style={{ fontSize: 13, color: t.textBody, lineHeight: 1.5 }}>
                    Positive replies <span style={{ color: t.textMuted }}>÷</span> Total emails sent<br />
                    <span style={{ fontSize: 11, color: t.textMuted }}>Excludes auto-replies &amp; negative replies. Positive = expressed interest / opportunity.</span>
                  </div>
                </div>
                <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 12, padding: '14px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Formula</div>
                  <div style={{ fontSize: 13, color: t.textBody, lineHeight: 1.5 }}>
                    Booked calls <span style={{ color: t.textMuted }}>÷</span> Positive replies<br />
                    <span style={{ fontSize: 11, color: t.textMuted }}>Connected to Microsoft Bookings calendar. Booked = meetings booked in Instantly.</span>
                  </div>
                </div>
              </div>

              {/* ── Footer ── */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: 10,
              }}>
                {lastUpdated && (
                  <div style={{ fontSize: 12, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                    Updated {lastUpdated.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} · auto-refresh every 5 min
                  </div>
                )}
                <button onClick={() => fetchData(days)} style={{
                  fontSize: 12, padding: '8px 16px', borderRadius: 6,
                  border: `0.5px solid ${t.primary}33`,
                  background: t.primaryLight,
                  color: t.primary, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}>Refresh</button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${t.bodyBg}; transition: background 0.3s; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
      `}</style>
    </>
  );
}
