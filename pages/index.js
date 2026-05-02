import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';

const COLORS = ['#1D9E75', '#378ADD', '#D85A30', '#7F77DD', '#BA7517', '#D4537E'];
const BG_COLORS = ['#E1F5EE', '#E6F1FB', '#FAECE7', '#EEEDFE', '#FAEEDA', '#FBEAF0'];
const TEXT_COLORS = ['#0F6E56', '#185FA5', '#993C1D', '#3C3489', '#854F0B', '#993356'];

function StatusBadge({ status }) {
  const map = { 1: ['Active', '#1D9E75'], 2: ['Paused', '#888'], 0: ['Draft', '#888'], 3: ['Completed', '#378ADD'] };
  const [label, color] = map[status] || ['Unknown', '#888'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

function MetricCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: '#f7f7f5', borderRadius: 8, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 500, color: accent || '#111' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ background: '#eee', borderRadius: 999, height: 4, width: '100%', overflow: 'hidden' }}>
      <div style={{ height: 4, borderRadius: 999, background: color, width: `${pct}%` }} />
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

  const campaigns = data?.campaigns || [];
  const totSent = campaigns.reduce((a, c) => a + c.sent, 0);
  const totReplies = campaigns.reduce((a, c) => a + c.replies, 0);
  const totLeads = campaigns.reduce((a, c) => a + c.leads, 0);
  const totOpp = campaigns.reduce((a, c) => a + c.opportunities, 0);
  const replyRate = totSent > 0 ? (totReplies / totSent * 100).toFixed(1) : '0.0';
  const maxSent = Math.max(...campaigns.map(c => c.sent), 1);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <Head>
        <title>MOM AI — Campaign Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=DM+Mono:wght@400&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#fafaf8', color: '#111', padding: '2rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1D9E75' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase' }}>MOM AI Technologies</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Active Campaign Dashboard</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: '#1D9E75', fontWeight: 500 }}>Live</span>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888', fontSize: 14 }}>Loading campaign data…</div>
        )}

        {error && (
          <div style={{ background: '#FAECE7', border: '0.5px solid #D85A30', borderRadius: 8, padding: '1rem', color: '#993C1D', fontSize: 14, marginBottom: '1.5rem' }}>
            Error: {error}. Check that INSTANTLY_API_KEY is set in Vercel environment variables.
          </div>
        )}

        {!loading && !error && campaigns.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888', fontSize: 14 }}>No active campaigns found.</div>
        )}

        {!loading && campaigns.length > 0 && (
          <>
            {/* Summary metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
              <MetricCard label="Total leads" value={totLeads.toLocaleString()} sub="across active campaigns" />
              <MetricCard label="Emails sent" value={totSent.toLocaleString()} sub="all time" />
              <MetricCard label="Total replies" value={totReplies} sub={`${replyRate}% reply rate`} accent="#1D9E75" />
              <MetricCard label="Opportunities" value={totOpp} sub="in pipeline" accent="#378ADD" />
            </div>

            {/* Campaign cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
              {campaigns.map((c, i) => {
                const color = COLORS[i % COLORS.length];
                const bg = BG_COLORS[i % BG_COLORS.length];
                const tc = TEXT_COLORS[i % TEXT_COLORS.length];
                const rr = c.sent > 0 ? (c.replies / c.sent * 100).toFixed(1) : '0.0';
                return (
                  <div key={c.id} style={{ background: '#fff', border: '0.5px solid #e5e5e3', borderRadius: 12, padding: '1.25rem', borderTop: `3px solid ${color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4, flex: 1, marginRight: 8 }}>{c.name}</div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      {[
                        ['Leads', c.leads.toLocaleString()],
                        ['Sent', c.sent.toLocaleString()],
                        ['Replies', c.replies],
                        ['Bounced', c.bounced],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                          <div style={{ fontSize: 18, fontWeight: 500 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 4 }}>
                        <span>Send progress</span>
                        <span style={{ color: tc, background: bg, padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{rr}% reply rate</span>
                      </div>
                      <MiniBar value={c.sent} max={maxSent} color={color} />
                    </div>
                    {c.opportunities > 0 && (
                      <div style={{ marginTop: 10, background: '#E1F5EE', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#0F6E56', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Opportunities</span>
                        <span style={{ fontWeight: 500 }}>{c.opportunities}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Detailed table */}
            <div style={{ background: '#fff', border: '0.5px solid #e5e5e3', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Full breakdown</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
                <thead>
                  <tr>
                    {['Campaign', 'Leads', 'Sent', 'Contacted', 'Replies', 'Reply %', 'Bounced', 'Opp.'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '0.5px solid #e5e5e3', fontSize: 11, color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => {
                    const color = COLORS[i % COLORS.length];
                    const rr = c.sent > 0 ? (c.replies / c.sent * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={c.id}>
                        <td style={{ padding: '10px 6px', borderBottom: '0.5px solid #f0f0ee', fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12 }}>{c.name}</span>
                          </div>
                        </td>
                        {[c.leads.toLocaleString(), c.sent.toLocaleString(), c.contacted.toLocaleString(), c.replies, `${rr}%`, c.bounced, c.opportunities].map((v, j) => (
                          <td key={j} style={{ padding: '10px 6px', borderBottom: '0.5px solid #f0f0ee', color: '#444' }}>{v}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Share section */}
            <div style={{ background: '#f7f7f5', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Share this dashboard</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#888', background: '#fff', border: '0.5px solid #e5e5e3', borderRadius: 6, padding: '8px 12px', flex: 1, minWidth: 200 }}>
                {typeof window !== 'undefined' ? window.location.href : ''}
              </div>
              <button onClick={copyLink} style={{ fontSize: 12, padding: '8px 16px', borderRadius: 6, border: '0.5px solid #e5e5e3', background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#111' }}>
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <button onClick={fetchData} style={{ fontSize: 12, padding: '8px 16px', borderRadius: 6, border: '0.5px solid #1D9E75', background: '#E1F5EE', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#0F6E56' }}>
                Refresh
              </button>
            </div>

            {lastUpdated && (
              <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: '1rem' }}>
                Last updated: {lastUpdated.toLocaleString('en-IS', { dateStyle: 'medium', timeStyle: 'short' })} · Auto-refreshes every 5 min
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
      `}</style>
    </>
  );
}
