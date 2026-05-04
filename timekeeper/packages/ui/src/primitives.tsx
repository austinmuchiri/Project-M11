import * as React from 'react';
import { APP } from './tokens.js';
import { AppIcon, type IconName } from './icons.js';

// ─────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────
export function Card({
  children, style, padding = 16, onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: number;
  onClick?: () => void;
}) {
  return (
    <div onClick={onClick} style={{
      background: APP.surface,
      borderRadius: APP.rLg,
      padding,
      border: `1px solid ${APP.border}`,
      boxShadow: APP.shadowSm,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

export function SectionTitle({
  children, action, style,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 4px 8px', ...style,
    }}>
      <div style={{
        fontFamily: APP.font, fontWeight: 700, fontSize: 11,
        letterSpacing: 1.4, textTransform: 'uppercase', color: APP.inkDim,
      }}>{children}</div>
      {action && <div style={{ fontSize: 12, color: APP.brand, fontWeight: 600 }}>{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Pill / status dot
// ─────────────────────────────────────────────────────────
export function Pill({
  children, color = APP.ink2, bg = APP.bgSoft, border, style, icon, onClick,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  border?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <span onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      background: bg, color, fontSize: 11, fontWeight: 700,
      border: border ? `1px solid ${border}` : '1px solid transparent',
      cursor: onClick ? 'pointer' : 'default',
      whiteSpace: 'nowrap', lineHeight: 1.2,
      ...style,
    }}>
      {icon}{children}
    </span>
  );
}

export function StatusDot({
  color, size = 8, pulse = false, style,
}: {
  color: string;
  size?: number;
  pulse?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      background: color,
      animation: pulse ? 'tk-pulse 1.8s ease-out infinite' : 'none',
      ...style,
    }}/>
  );
}

// ─────────────────────────────────────────────────────────
// Sparkline + bars + ring
// ─────────────────────────────────────────────────────────
export function Sparkline({
  data, w = 260, h = 60, color = APP.brand, fill = true,
}: {
  data: number[];
  w?: number; h?: number; color?: string; fill?: boolean;
}) {
  if (!data.length) return null;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - (v / 100) * (h - 4) - 2] as const);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = `${path} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1]!;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="tk-spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {fill && <path d={area} fill="url(#tk-spark)"/>}
      <path d={path} fill="none" stroke={color} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r={3} fill={color}/>
    </svg>
  );
}

export function BarChart<D extends Record<string, unknown>>({
  data, w = 260, h = 100, color = APP.brand, labelKey = 'd' as keyof D, valueKey = 'pct' as keyof D,
}: {
  data: D[];
  w?: number; h?: number; color?: string;
  labelKey?: keyof D; valueKey?: keyof D;
}) {
  const gap = 6;
  const barW = (w - gap * (data.length - 1)) / data.length;
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <line x1={0} x2={w} y1={h - 16} y2={h - 16} stroke={APP.border}/>
      {data.map((d, i) => {
        const v = Number(d[valueKey]);
        const bh = (v / 100) * (h - 32);
        const x = i * (barW + gap);
        const y = h - 16 - bh;
        const isLast = i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh}
                  fill={isLast ? color : APP.brandSoft}
                  rx="3"/>
            <text x={x + barW / 2} y={h - 4} textAnchor="middle"
                  fontFamily={APP.font} fontSize="10" fontWeight="700"
                  fill={isLast ? APP.ink : APP.inkDim}>{String(d[labelKey])}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function RingGauge({
  pct, size = 64, stroke = 6, color = APP.brand,
  track = APP.brandSoft, children,
}: {
  pct: number; size?: number; stroke?: number;
  color?: string; track?: string; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Tiny watch face — hero illustration in caregiver app
// ─────────────────────────────────────────────────────────
export function MiniWatchFace({
  taskLabel, taskIcon = 'brush', taskColor = APP.brand,
  time = '7:23', battery = 64, w = 120, h = 140,
}: {
  taskLabel: string; taskIcon?: IconName; taskColor?: string;
  time?: string; battery?: number; w?: number; h?: number;
}) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 22,
      background: '#1A1F1D',
      padding: 8, position: 'relative',
      boxShadow: '0 6px 16px rgba(31,46,39,0.18), inset 0 0 0 2px #0E1311',
    }}>
      <div style={{
        position: 'absolute', right: -3, top: '38%', width: 4, height: 16,
        background: '#0E1311', borderRadius: 2,
      }}/>
      <div style={{
        width: '100%', height: '100%', borderRadius: 14,
        background: '#0F1514', padding: '6px 10px',
        display: 'flex', flexDirection: 'column',
        fontFamily: APP.font, color: '#F4EFE6',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, opacity: 0.7 }}>
          <span>{time}</span><span>{battery}%</span>
        </div>
        <div style={{
          marginTop: 8, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 6,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 999,
            background: taskColor + '25', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            border: `1.5px solid ${taskColor}`,
          }}>
            <AppIcon name={taskIcon} size={22} color={taskColor}/>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>{taskLabel}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// IconBadge / KidAvatar / Toggle / Btn
// ─────────────────────────────────────────────────────────
export function IconBadge({
  name, color = APP.brand, bg, size = 36, iconSize = 18,
}: {
  name: IconName; color?: string; bg?: string;
  size?: number; iconSize?: number;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: bg || color + '22',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <AppIcon name={name} size={iconSize} color={color}/>
    </div>
  );
}

export function KidAvatar({
  size = 40, name = 'M', color = APP.accent, ring = false,
}: {
  size?: number; name?: string; color?: string; ring?: boolean;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '25',
      border: ring ? `2px solid ${APP.brand}` : `1.5px solid ${color}55`,
      color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: APP.fontDisp, fontWeight: 800, fontSize: size * 0.42,
    }}>{name[0]}</div>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 44, height: 26, borderRadius: 999, padding: 2,
      background: on ? APP.brand : APP.borderStrong,
      border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center',
      justifyContent: on ? 'flex-end' : 'flex-start',
      transition: 'background 0.18s',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}/>
    </button>
  );
}

export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';

export function Btn({
  children, variant = 'primary', size = 'md', onClick, icon, style, full,
}: {
  children: React.ReactNode;
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  full?: boolean;
  disabled?: boolean;
}) {
  const sz = size === 'sm' ? { h: 32, fs: 12, px: 12 }
    : size === 'lg' ? { h: 48, fs: 15, px: 18 }
    : { h: 40, fs: 13, px: 14 };
  const v = ({
    primary:   { bg: APP.brand, color: '#fff', border: 'transparent' },
    secondary: { bg: APP.bgSoft, color: APP.ink, border: APP.border },
    ghost:     { bg: 'transparent', color: APP.ink2, border: 'transparent' },
    outline:   { bg: APP.surface, color: APP.ink, border: APP.borderStrong },
    danger:    { bg: APP.dangerSoft, color: APP.danger, border: 'transparent' },
  } as const)[variant];
  return (
    <button onClick={onClick} style={{
      height: sz.h, padding: `0 ${sz.px}px`, borderRadius: 10,
      background: v.bg, color: v.color, border: `1px solid ${v.border}`,
      fontFamily: APP.font, fontSize: sz.fs, fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: 8,
      cursor: 'pointer', justifyContent: 'center',
      width: full ? '100%' : 'auto',
      ...style,
    }}>
      {icon}{children}
    </button>
  );
}

export const TABS: ReadonlyArray<{ id: string; label: string; icon: IconName }> = [
  { id: 'home',      label: 'Today',    icon: 'home' },
  { id: 'schedule',  label: 'Schedule', icon: 'schedule' },
  { id: 'analytics', label: 'Insights', icon: 'analytics' },
  { id: 'notes',     label: 'Alerts',   icon: 'bell' },
  { id: 'settings',  label: 'Settings', icon: 'gear' },
];

export function BottomTabs({
  active, onChange, unread = 0,
}: {
  active: string;
  onChange: (id: string) => void;
  unread?: number;
}) {
  return (
    <div style={{
      borderTop: `1px solid ${APP.border}`,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(14px)',
      display: 'flex',
      padding: '8px 4px 6px',
      fontFamily: APP.font,
    }}>
      {TABS.map(t => {
        const on = t.id === active;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, background: 'transparent', border: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, padding: '6px 0', cursor: 'pointer',
            color: on ? APP.brand : APP.inkDim,
          }}>
            <div style={{ position: 'relative' }}>
              <AppIcon name={t.icon} size={22} strokeWidth={on ? 2 : 1.6}/>
              {t.id === 'notes' && unread > 0 && (
                <span style={{
                  position: 'absolute', top: -2, right: -6, minWidth: 14, height: 14,
                  borderRadius: 8, background: APP.danger, color: '#fff',
                  fontSize: 9, fontWeight: 800, padding: '0 4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{unread}</span>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: on ? 800 : 600 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function AppHeader({
  title, subtitle, trailing, onBack,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <div style={{
      padding: '12px 18px 10px',
      display: 'flex', alignItems: 'center',
      gap: 10, fontFamily: APP.font,
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          width: 32, height: 32, borderRadius: 16,
          border: 'none', background: APP.bgSoft, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: APP.ink,
        }}>
          <AppIcon name="chevron" size={16} color={APP.ink} style={{ transform: 'rotate(180deg)' }}/>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 22,
          color: APP.ink, lineHeight: 1.1, letterSpacing: -0.4,
        }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: APP.inkDim, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {trailing}
    </div>
  );
}

export const GLOBAL_CSS = `
  @keyframes tk-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(127,163,142,0.5); }
    70%  { box-shadow: 0 0 0 6px rgba(127,163,142,0); }
    100% { box-shadow: 0 0 0 0 rgba(127,163,142,0); }
  }
  @keyframes tk-breathe {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.04); }
  }
  @keyframes tk-spin { to { transform: rotate(360deg); } }
  button:active { transform: scale(0.98); }
  ::-webkit-scrollbar { width: 0; height: 0; }
`;
