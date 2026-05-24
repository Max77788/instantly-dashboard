import { useEffect, useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const ContactedChart = dynamic(() => import('../components/ContactedChart'), { ssr: false });

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
  surfaceSolid: '#fff',
  highlightUnread: '#eef2ff',
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
  surfaceSolid: '#13131a',
  highlightUnread: 'rgba(99,102,241,0.12)',
};

// ── Sub-components ──
function KPI({ label, current, target, format, t, formula, note }) {
  const met = current >= target;
  const val = format === 'pct' ? (current * 100).toFixed(1) + '%' : current.toLocaleString();
  const tgt = format === 'pct' ? (target * 100).toFixed(1) + '%' : target.toLocaleString();
  const barPct = target > 0 ? Math.min(current / target * 100, 100) : 0;
  return (
    <div className="lift-card" style={{ background: t.kpiCardBg, border: `0.5px solid ${t.kpiCardBorder}`, borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: t.textBody }}>{label}</span>
        <span className="kpi-tooltip-wrap" style={{ position: 'relative', display: 'inline-flex', cursor: 'help' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 16, height: 16, borderRadius: '50%', fontSize: 10, fontWeight: 700,
            color: t.textMuted, background: t.borderLight, lineHeight: 1,
          }}>?</span>
          <span className="kpi-tooltip" style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
            background: t.tooltipBg, border: `0.5px solid ${t.tooltipBorder}`, borderRadius: 8,
            padding: '10px 14px', fontSize: 12, color: t.tooltipText, fontWeight: 400,
            whiteSpace: 'nowrap', boxShadow: t.tooltipShadow,
            pointerEvents: 'none', opacity: 0, transition: 'opacity 0.15s',
          }}>
            <strong>Formula:</strong> {formula}<br />
            <span style={{ color: t.textMuted }}>{note}</span>
          </span>
        </span>
      </div>
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
  const [tab, setTab] = useState('analytics');
  const [unibox, setUnibox] = useState(null);
  const [uniboxLoading, setUniboxLoading] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);

  const t = dark ? DARK : LIGHT;

  const toggleTheme = () => setDark(!dark);

  const fetchUnibox = useCallback(async () => {
    try {
      setUniboxLoading(true);
      const res = await fetch('/api/unibox');
      if (!res.ok) throw new Error('Failed to fetch unibox');
      const json = await res.json();
      setUnibox(json);
    } catch (e) {
      setUnibox({ error: e.message });
    } finally {
      setUniboxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'unibox' && !unibox) fetchUnibox();
  }, [tab, unibox, fetchUnibox]);

  const openThread = useCallback(async (threadId, sender) => {
    try {
      setThreadLoading(true);
      setSelectedThread({ threadId, sender, loading: true });
      const res = await fetch(`/api/thread?thread_id=${encodeURIComponent(threadId)}`);
      if (!res.ok) throw new Error('Failed to fetch thread');
      const json = await res.json();
      setSelectedThread({ threadId, sender, messages: json.messages || [] });
    } catch (e) {
      setSelectedThread({ error: e.message });
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const closeThread = () => setSelectedThread(null);

  // Group unibox messages by sender
  const uniboxGroups = useMemo(() => {
    if (!unibox?.messages) return [];
    const map = {};
    unibox.messages.forEach(m => {
      const key = m.from || 'unknown';
      if (!map[key]) {
        map[key] = { sender: key, threadId: m.threadId, subject: m.subject, messages: [], latest: null, hasUnread: false, responseType: 'unknown' };
      }
      map[key].messages.push(m);
      if (!map[key].latest || new Date(m.createdAt) > new Date(map[key].latest.createdAt)) {
        map[key].latest = m;
        map[key].responseType = m.responseType || 'unknown';
      }
      if (m.isUnread) map[key].hasUnread = true;
    });
    return Object.values(map).sort((a, b) => new Date(b.latest.createdAt) - new Date(a.latest.createdAt));
  }, [unibox]);

  const responseLabel = (type) => {
    const labels = {
      positive:  { text: '🔥 POSITIVE', color: t.green, bg: t.greenBg, pulse: true },
      interested:{ text: '👀 INTERESTED', color: t.amber, bg: t.amberBg, pulse: false },
      neutral:   { text: 'NEUTRAL', color: t.textMuted, bg: t.borderLight, pulse: false },
      auto:      { text: 'AUTO', color: '#6366f1', bg: 'rgba(99,102,241,0.10)', pulse: false },
      negative:  { text: 'NEGATIVE', color: t.red, bg: t.redBg, pulse: false },
      unknown:   { text: 'UNREAD', color: t.primary, bg: t.primaryLight, pulse: false },
    };
    return labels[type] || labels.unknown;
  };

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
  const segments = data?.segments || [];

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

      <div
        className={dark ? 'theme-dark' : 'theme-light'}
        style={{
          fontFamily: "'Inter', -apple-system, sans-serif",
          minHeight: '100vh',
          background: t.bg,
          color: t.textBody,
          padding: '2rem 1.5rem',
          transition: 'background 0.3s, color 0.3s',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '2rem', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                AI FusionIQ Labs <span style={{ fontSize: 10, color: t.textFaint, marginLeft: 6 }}>v1.3</span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: t.textHeading }}>
                Sunita Campaign • <span style={{ fontWeight: 400, color: t.textMuted }}>Analytics</span>
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Instantly link */}
              <a
                href="https://app.instantly.ai/share/campaign?id=7ffce713-0d9d-4175-8d38-81742334b211"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 6,
                  border: `0.5px solid ${t.primary}33`,
                  background: t.primaryLight,
                  color: t.primary, textDecoration: 'none',
                  fontFamily: "'Inter', sans-serif",
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Open in Instantly
              </a>

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

          {/* ── Tab bar ── */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: '1.5rem',
            background: t.borderLight, borderRadius: 10, padding: 3,
            width: 'fit-content',
          }}>
            {[
              ['analytics', 'Analytics'],
              ['unibox', 'Unibox Messages'],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                fontSize: 13, fontWeight: 600, padding: '8px 20px', borderRadius: 8,
                border: 'none',
                background: tab === key ? t.surface : 'transparent',
                color: tab === key ? t.textHeading : t.textMuted,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                transition: 'all 0.15s',
                boxShadow: tab === key ? `0 1px 3px rgba(0,0,0,0.06)` : 'none',
              }}>
                {label}
                {key === 'unibox' && uniboxGroups.length > 0 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 18, height: 18, borderRadius: 9,
                    background: t.primary, color: '#fff', fontSize: 10, fontWeight: 700,
                    marginLeft: 6, padding: '0 5px',
                  }}>
                    {uniboxGroups.length > 99 ? '99+' : uniboxGroups.filter(g => g.hasUnread).length || uniboxGroups.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Error ── */}
          {error && tab === 'analytics' && (
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
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No campaigns found</div>
              <div style={{ fontSize: 13 }}>Launch a campaign in Instantly to see analytics here.</div>
            </div>
          )}

          {tab === 'analytics' && !loading && stats && (
            <>
              {/* ═══════ SECTION 1 — Contacted Leads Chart ═══════ */}
              <ContactedChart data={dailyAgg} t={t} days={days} onDaysChange={setDays} />

              {/* ═══════ SECTION 2 — Campaign Send Table ═══════ */}
              <div className="lift-card" style={{
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
                <KPI t={t} label="Positive Reply Rate" current={positiveReplyRate} target={0.02} format="pct"
                  formula="Positive replies ÷ Total emails sent"
                  note="Excludes auto-replies &amp; negative replies. Positive = expressed interest / opportunity." />
                <KPI t={t} label="Booked Call Rate" current={bookedCallRate} target={0.25} format="pct"
                  formula="Booked calls ÷ Positive replies"
                  note="Connected to Microsoft Bookings calendar. Booked = meetings booked in Instantly." />
              </div>

              {/* ═══════ SECTION 4 — By Segment Table ═══════ */}
              {segments.length > 0 && (
                <div style={{
                  background: t.surface, border: `0.5px solid ${t.border}`,
                  borderRadius: 14, padding: '20px 24px', marginBottom: '1.25rem',
                  overflowX: 'auto',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.textBody, marginBottom: 14 }}>
                    By Segment
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
                    <thead>
                      <tr>
                        {['Segment', 'Status', 'Leads', 'Sent', 'Replies', 'Bounced', 'OPP', '% Replied'].map(h => (
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
                      {segments.map((s, i) => (
                        <tr key={s.id}>
                          <td style={{
                            padding: '12px 12px', borderBottom: `0.5px solid ${t.borderLight}`,
                            fontWeight: 600, color: t.textBody, fontSize: 13,
                          }}>{s.name}</td>
                          <td style={{ padding: '12px 12px', borderBottom: `0.5px solid ${t.borderLight}`, fontSize: 11 }}>
                            {s.status === 1 ? (
                              <span style={{ color: t.green, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.green }} /> Active
                              </span>
                            ) : s.status === 2 ? (
                              <span style={{ color: t.amber, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.amber }} /> Paused
                              </span>
                            ) : (
                              <span style={{ color: t.textMuted, fontWeight: 500 }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 12px', borderBottom: `0.5px solid ${t.borderLight}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: t.textBody }}>{fmt(s.leads)}</td>
                          <td style={{ padding: '12px 12px', borderBottom: `0.5px solid ${t.borderLight}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: t.textBody }}>{fmt(s.sent)}</td>
                          <td style={{ padding: '12px 12px', borderBottom: `0.5px solid ${t.borderLight}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: t.textBody }}>{fmt(s.replies)}</td>
                          <td style={{ padding: '12px 12px', borderBottom: `0.5px solid ${t.borderLight}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: t.textBody }}>{fmt(s.bounced)}</td>
                          <td style={{ padding: '12px 12px', borderBottom: `0.5px solid ${t.borderLight}`, color: t.green, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{fmt(s.opportunities)}</td>
                          <td style={{ padding: '12px 12px', borderBottom: `0.5px solid ${t.borderLight}`, fontWeight: 600, color: t.primary, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{s.replyPct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Footer ── */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: 10,
              }}>
                {lastUpdated && (
                  <div style={{ fontSize: 12, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                    Updated {lastUpdated.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} · auto-refresh every 5 min
                    <span style={{ fontSize: 10, color: t.textFaint, marginLeft: 4 }}>v1.3</span>
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

          {/* ═══════ UNIBOX TAB ═══════ */}
          {tab === 'unibox' && (
            <div style={{
              background: t.surface, border: `0.5px solid ${t.border}`,
              borderRadius: 14, padding: '20px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.textBody }}>Unibox Messages</div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>
                    {unibox?.accounts?.length || 0} email account{(unibox?.accounts?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <button onClick={fetchUnibox} style={{
                  fontSize: 12, padding: '7px 14px', borderRadius: 6,
                  border: `0.5px solid ${t.primary}33`,
                  background: t.primaryLight,
                  color: t.primary, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {uniboxLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {/* Response type summary bar */}
              {uniboxGroups.length > 0 && (
                <div style={{
                  display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16,
                  padding: '10px 14px', borderRadius: 10,
                  background: t.borderLight,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4, display: 'flex', alignItems: 'center' }}>
                    Breakdown
                  </span>
                  {['positive', 'interested', 'neutral', 'auto', 'negative', 'unknown'].map(type => {
                    const count = uniboxGroups.filter(g => g.responseType === type).length;
                    if (count === 0) return null;
                    const lbl = responseLabel(type);
                    return (
                      <span key={type} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999,
                        background: lbl.bg, color: lbl.color,
                        ...(type === 'positive' ? { animation: 'pulse 2s infinite', boxShadow: `0 0 10px ${t.green}33` } : {}),
                      }}>
                        {lbl.text}: {count}
                      </span>
                    );
                  })}
                </div>
              )}

              {uniboxLoading && !unibox && (
                <div style={{ textAlign: 'center', padding: '3rem', color: t.textMuted, fontSize: 13 }}>Loading messages...</div>
              )}

              {unibox?.error && (
                <div style={{
                  background: t.redBg, border: `0.5px solid ${t.red}33`, borderRadius: 8,
                  padding: '10px 14px', color: t.red, fontSize: 12, marginBottom: 12,
                }}>{unibox.error}</div>
              )}

              {unibox && !unibox.error && unibox.messages?.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: t.textMuted, fontSize: 13 }}>
                  No messages found.
                </div>
              )}

              {uniboxGroups.length > 0 && (
                <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                  {uniboxGroups.map((g) => (
                    <div
                      key={g.sender}
                      onClick={() => openThread(g.threadId, g.sender)}
                      style={{
                        display: 'block', color: 'inherit', cursor: 'pointer',
                        padding: '14px 16px', borderRadius: 8,
                        borderBottom: `0.5px solid ${t.borderLight}`,
                        background: g.hasUnread ? t.primaryLight : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!g.hasUnread) e.currentTarget.style.background = t.borderLight; }}
                      onMouseLeave={e => { if (!g.hasUnread) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                              background: responseLabel(g.responseType).bg,
                              color: responseLabel(g.responseType).color,
                              textTransform: 'uppercase', letterSpacing: '0.04em',
                              whiteSpace: 'nowrap',
                              ...(g.responseType === 'positive' ? {
                                animation: 'pulse 2s infinite',
                                boxShadow: `0 0 12px ${t.green}44`,
                              } : {}),
                            }}>
                              {responseLabel(g.responseType).text}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 1 }}>
                            <span style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: g.hasUnread ? `linear-gradient(135deg, ${t.primary}, #764ba2)` : t.borderLight,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 700, color: g.hasUnread ? '#fff' : t.textMuted,
                              flexShrink: 0,
                            }}>
                              {(g.sender || '?')[0].toUpperCase()}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: t.textHeading }}>
                                {g.hasUnread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.primary, display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />}
                                {g.sender}
                              </div>
                              <div style={{ fontSize: 12, color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {g.subject}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 11, color: t.textMuted, whiteSpace: 'nowrap' }}>
                            {new Date(g.latest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            minWidth: 20, height: 20, borderRadius: 10, marginTop: 4,
                            background: t.borderLight, fontSize: 10, fontWeight: 600,
                            color: t.textMuted, padding: '0 6px',
                          }}>
                            {g.messages.length}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        fontSize: 12, color: t.textMuted, lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: '100%', marginTop: 2,
                      }}>
                        {g.latest.bodyPreview || '(no preview)'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ═══════ THREAD MODAL ═══════ */}
      {selectedThread && (
        <div
          onClick={closeThread}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '40px 16px', overflowY: 'auto',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: t.surfaceSolid, border: `0.5px solid ${t.border}`,
              borderRadius: 14, width: '100%', maxWidth: 720, maxHeight: '85vh',
              overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderBottom: `0.5px solid ${t.borderLight}`,
              position: 'sticky', top: 0, background: t.surfaceSolid, zIndex: 1,
              borderTopLeftRadius: 14, borderTopRightRadius: 14,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: t.textHeading }}>
                {selectedThread.sender || 'Conversation'}
              </span>
              <button onClick={closeThread} style={{
                width: 28, height: 28, borderRadius: '50%', border: 'none',
                background: t.borderLight, color: t.textMuted, cursor: 'pointer',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1, fontFamily: "'Inter', sans-serif",
              }}>×</button>
            </div>

            {/* Loading */}
            {selectedThread.loading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: t.textMuted, fontSize: 13 }}>
                Loading conversation...
              </div>
            )}

            {/* Error */}
            {selectedThread.error && (
              <div style={{ padding: '2rem', textAlign: 'center', color: t.red, fontSize: 13 }}>
                Failed to load thread: {selectedThread.error}
              </div>
            )}

            {/* Thread messages */}
            {selectedThread.messages?.map((m, i) => (
              <div key={m.id} style={{
                padding: '16px 24px',
                borderBottom: i < selectedThread.messages.length - 1 ? `0.5px solid ${t.borderLight}` : 'none',
                background: m.isUnread ? t.highlightUnread : 'transparent',
              }}>
                {/* Message header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.textHeading, marginBottom: 1 }}>
                      {m.from}
                    </div>
                    <div style={{ fontSize: 11, color: t.textMuted }}>
                      to {m.to?.join(', ') || m.eaccount}
                      {m.cc?.length > 0 && <span> · cc: {m.cc.join(', ')}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: t.textMuted, whiteSpace: 'nowrap' }}>
                      {new Date(m.createdAt).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                      {m.isAutoReply && (
                        <span style={{ fontSize: 9, fontWeight: 500, color: t.amber, background: t.amberBg, padding: '1px 6px', borderRadius: 999 }}>Auto</span>
                      )}
                      {m.responseType && m.responseType !== 'unknown' && (
                        <span style={{
                          fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                          background: responseLabel(m.responseType).bg,
                          color: responseLabel(m.responseType).color,
                        }}>
                          {responseLabel(m.responseType).text}
                        </span>
                      )}
                      {m.aiInterest > 0.5 && (
                        <span style={{ fontSize: 9, fontWeight: 500, color: t.green, background: t.greenBg, padding: '1px 6px', borderRadius: 999 }}>Interest {(m.aiInterest * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subject for first message */}
                {i === 0 && m.subject && (
                  <div style={{ fontSize: 12, fontWeight: 500, color: t.textMuted, marginBottom: 8 }}>
                    Subject: {m.subject}
                  </div>
                )}

                {/* Body */}
                <div style={{
                  fontSize: 13, lineHeight: 1.65, color: t.textBody,
                  wordBreak: 'break-word',
                }}>
                  {m.bodyHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: m.bodyHtml }} style={{ wordBreak: 'break-word' }} />
                  ) : m.bodyText ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.bodyText}</div>
                  ) : (
                    <div style={{ color: t.textMuted }}>(no content)</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${t.bodyBg}; transition: background 0.3s; }
        .lift-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          will-change: transform, box-shadow;
        }
        .theme-light .lift-card {
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
        }
        .theme-dark .lift-card {
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
        }
        .theme-light .lift-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 15px 35px rgba(15, 23, 42, 0.18);
        }
        .theme-dark .lift-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.65);
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        .kpi-tooltip-wrap:hover .kpi-tooltip { opacity: 1 !important; }
      `}</style>
    </>
  );
}
