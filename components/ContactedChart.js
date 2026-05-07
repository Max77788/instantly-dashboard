import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ContactedChart({ data, t, days, onDaysChange }) {
  return (
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
            <button key={d} onClick={() => onDaysChange(d)} style={{
              fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6,
              border: days === d ? `1px solid ${t.primary}` : `0.5px solid ${t.timeBtnBorder}`,
              background: days === d ? t.primaryLight : t.timeBtnBg,
              color: days === d ? t.primary : t.timeBtnText,
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}>{d}D</button>
          ))}
        </div>
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 4 }}>
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
  );
}
