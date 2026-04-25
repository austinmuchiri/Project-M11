// Shared UI primitives for the caregiver app.
// Card, Pill, IconBadge, Sparkline, RingGauge, MiniWatchFace, StatusDot, BottomTabs, etc.
// Keep these tiny and composable.

// ─────────────────────────────────────────────────────────
// Icons (line, 20px default) — task icons + nav icons
// All are stroke-based, neutral, to fit calm/clinical tone.
// ─────────────────────────────────────────────────────────
function AppIcon({ name, size = 20, color = 'currentColor', strokeWidth = 1.6 }) {
  const p = { size, color, strokeWidth };
  const baseProps = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'home':       return <svg {...baseProps}><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>;
    case 'schedule':   return <svg {...baseProps}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case 'analytics':  return <svg {...baseProps}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>;
    case 'bell':       return <svg {...baseProps}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
    case 'gear':       return <svg {...baseProps}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'star':       return <svg {...baseProps}><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.6l1.1-6L3.4 9.4l6-.8z"/></svg>;
    case 'check':      return <svg {...baseProps}><path d="M5 12l5 5 9-11"/></svg>;
    case 'x':          return <svg {...baseProps}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'chevron':    return <svg {...baseProps}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevronDown':return <svg {...baseProps}><path d="M6 9l6 6 6-6"/></svg>;
    case 'plus':       return <svg {...baseProps}><path d="M12 5v14M5 12h14"/></svg>;
    case 'send':       return <svg {...baseProps}><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
    case 'watch':      return <svg {...baseProps}><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 6V3h6v3M9 18v3h6v-3"/><path d="M12 10v3l2 1"/></svg>;
    case 'laptop':     return <svg {...baseProps}><rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M2 19h20"/></svg>;
    case 'wifi':       return <svg {...baseProps}><path d="M2 9a16 16 0 0 1 20 0"/><path d="M5 13a11 11 0 0 1 14 0"/><path d="M9 17a6 6 0 0 1 6 0"/><circle cx="12" cy="20" r="0.6" fill={color}/></svg>;
    case 'battery':    return <svg {...baseProps}><rect x="2" y="7" width="18" height="10" rx="1.5"/><path d="M22 11v2"/></svg>;
    case 'brush':      return <svg {...baseProps}><path d="M14 4l6 6-9 9-6-6z"/><path d="M3 21l3-3"/></svg>;
    case 'shirt':      return <svg {...baseProps}><path d="M5 6l3-3 4 2 4-2 3 3-3 3v11H8V9z"/></svg>;
    case 'plate':      return <svg {...baseProps}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg>;
    case 'bag':        return <svg {...baseProps}><path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>;
    case 'book':       return <svg {...baseProps}><path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z"/><path d="M4 5v15"/></svg>;
    case 'shower':     return <svg {...baseProps}><path d="M7 14h10M9 17v3M12 17v3M15 17v3"/><path d="M12 11V5a3 3 0 0 1 6 0"/></svg>;
    case 'moon':       return <svg {...baseProps}><path d="M21 13a8 8 0 1 1-10-10 6 6 0 0 0 10 10z"/></svg>;
    case 'sun':        return <svg {...baseProps}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></svg>;
    case 'school':     return <svg {...baseProps}><path d="M3 10l9-5 9 5-9 5z"/><path d="M7 12v5a5 5 0 0 0 10 0v-5"/></svg>;
    case 'pencil':     return <svg {...baseProps}><path d="M14 4l6 6-11 11H3v-6z"/></svg>;
    case 'play':       return <svg {...baseProps}><path d="M6 4l14 8-14 8z" fill={color} stroke="none"/></svg>;
    case 'pause':      return <svg {...baseProps}><rect x="6" y="5" width="4" height="14" rx="1" fill={color} stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill={color} stroke="none"/></svg>;
    case 'share':      return <svg {...baseProps}><path d="M4 12v8h16v-8"/><path d="M12 3v13M7 8l5-5 5 5"/></svg>;
    case 'download':   return <svg {...baseProps}><path d="M4 17v3h16v-3"/><path d="M12 4v12M7 11l5 5 5-5"/></svg>;
    case 'refresh':    return <svg {...baseProps}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>;
    case 'flame':      return <svg {...baseProps}><path d="M12 3c2 4-3 5 0 9 1.4 1.9 4 0 4-3 3 4 2 11-4 11s-8-6-4-11c2-2.5 3-3.5 4-6z"/></svg>;
    case 'arrow':      return <svg {...baseProps}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrowUp':    return <svg {...baseProps}><path d="M12 19V5M6 11l6-6 6 6"/></svg>;
    case 'arrowDown':  return <svg {...baseProps}><path d="M12 5v14M6 13l6 6 6-6"/></svg>;
    case 'minus':      return <svg {...baseProps}><path d="M5 12h14"/></svg>;
    case 'edit':       return <svg {...baseProps}><path d="M14 4l6 6-11 11H3v-6z"/></svg>;
    case 'gift':       return <svg {...baseProps}><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12"/><path d="M12 9c-2-3-6-3-6 0s3 0 6 0zM12 9c2-3 6-3 6 0s-3 0-6 0z"/></svg>;
    case 'fork':       return <svg {...baseProps}><path d="M9 3v9a3 3 0 0 0 6 0V3M12 12v9"/></svg>;
    case 'dot':        return <svg {...baseProps}><circle cx="12" cy="12" r="3" fill={color}/></svg>;
    default:           return <svg {...baseProps}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

// task -> icon name lookup
const TASK_ICON = {
  'Wake Up': 'sun', 'Brush Teeth': 'brush', 'Get Dressed': 'shirt',
  'Breakfast': 'plate', 'Pack Bag': 'bag', 'Math': 'pencil', 'Reading': 'book',
  'Lunch': 'plate', 'Science': 'book', 'Dinner': 'plate', 'Homework': 'pencil',
  'Shower': 'shower', 'Read': 'book', 'Sleep': 'moon',
};

// ─────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────
function Card({ children, style, padding = 16, onClick }) {
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

function SectionTitle({ children, action, style }) {
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
// Pill (status, filter, chip)
// ─────────────────────────────────────────────────────────
function Pill({ children, color = APP.ink2, bg = APP.bgSoft, border, style, icon, onClick }) {
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
      {icon}
      {children}
    </span>
  );
}

function StatusDot({ color, size = 8, pulse = false, style }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      background: color, position: 'relative',
      boxShadow: pulse ? `0 0 0 0 ${color}60` : 'none',
      animation: pulse ? 'app-pulse 1.8s ease-out infinite' : 'none',
      ...style,
    }}/>
  );
}

// ─────────────────────────────────────────────────────────
// Sparkline + Bar charts (data-forward, neutral)
// ─────────────────────────────────────────────────────────
function Sparkline({ data, w = 260, h = 60, color = APP.brand, fill = true }) {
  if (!data || !data.length) return null;
  const max = 100, min = 0;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / (max - min)) * (h - 4) - 2]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sparkfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {fill && <path d={area} fill="url(#sparkfill)"/>}
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3 : 1.6} fill={i === pts.length - 1 ? color : APP.surface} stroke={color} strokeWidth="1.4"/>
      ))}
    </svg>
  );
}

function BarChart({ data, w = 260, h = 100, color = APP.brand, labelKey = 'd', valueKey = 'pct', valueFormat = v => v + '%' }) {
  const pad = 16, gap = 6;
  const innerW = w - pad * 0;
  const barW = (innerW - gap * (data.length - 1)) / data.length;
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <line x1={0} x2={w} y1={h - 16} y2={h - 16} stroke={APP.border} strokeWidth="1"/>
      {data.map((d, i) => {
        const v = d[valueKey];
        const bh = ((v / 100) * (h - 32));
        const x = i * (barW + gap);
        const y = h - 16 - bh;
        const isLast = i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh}
                  fill={isLast ? color : APP.brandSoft}
                  stroke={isLast ? color : 'none'}
                  rx="3"/>
            <text x={x + barW / 2} y={h - 4} textAnchor="middle"
                  fontFamily={APP.font} fontSize="10" fontWeight="700"
                  fill={isLast ? APP.ink : APP.inkDim}>{d[labelKey]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function RingGauge({ pct, size = 64, stroke = 6, color = APP.brand, track = APP.brandSoft, children }) {
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
// MiniWatchFace — tiny rendering of the kid's watch face
// Used in Live Status hero, in Devices card, in Nudge composer.
// ─────────────────────────────────────────────────────────
function MiniWatchFace({ taskLabel = 'Brush Teeth', taskIcon = 'brush', taskColor = APP.brand, time = '7:23', battery = 64, w = 120, h = 140 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 22,
      background: '#1A1F1D',
      padding: 8, position: 'relative',
      boxShadow: '0 6px 16px rgba(31,46,39,0.18), inset 0 0 0 2px #0E1311',
    }}>
      {/* Crown nub */}
      <div style={{
        position: 'absolute', right: -3, top: '38%', width: 4, height: 16,
        background: '#0E1311', borderRadius: 2,
      }}/>
      {/* Inner screen */}
      <div style={{
        width: '100%', height: '100%', borderRadius: 14,
        background: '#0F1514', padding: '6px 10px',
        display: 'flex', flexDirection: 'column',
        fontFamily: APP.font, color: '#F4EFE6',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, opacity: 0.7 }}>
          <span>{time}</span>
          <span>{battery}%</span>
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
// Avatar (kid)
// ─────────────────────────────────────────────────────────
function KidAvatar({ size = 40, kid = SAM, ring = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: kid.avatarColor + '25',
      border: ring ? `2px solid ${APP.brand}` : `1.5px solid ${kid.avatarColor}55`,
      color: kid.avatarColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: APP.fontDisp, fontWeight: 800,
      fontSize: size * 0.42,
    }}>{kid.initials}</div>
  );
}

// ─────────────────────────────────────────────────────────
// IconBadge — round icon with soft tinted bg
// ─────────────────────────────────────────────────────────
function IconBadge({ name, color = APP.brand, bg, size = 36, iconSize = 18 }) {
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

// ─────────────────────────────────────────────────────────
// Bottom tab bar
// ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'home',     label: 'Today',    icon: 'home' },
  { id: 'schedule', label: 'Schedule', icon: 'schedule' },
  { id: 'analytics',label: 'Insights', icon: 'analytics' },
  { id: 'notes',    label: 'Alerts',   icon: 'bell' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
];

function BottomTabs({ active, onChange, platform = 'ios', unread = 0 }) {
  const isIos = platform === 'ios';
  return (
    <div style={{
      borderTop: `1px solid ${APP.border}`,
      background: isIos ? 'rgba(255,255,255,0.92)' : APP.surface,
      backdropFilter: 'blur(14px)',
      display: 'flex',
      padding: isIos ? '8px 4px 4px' : '6px 4px',
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
            position: 'relative',
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

// ─────────────────────────────────────────────────────────
// Top app header — used per-screen
// ─────────────────────────────────────────────────────────
function AppHeader({ title, subtitle, trailing, onBack }) {
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

// ─────────────────────────────────────────────────────────
// Button — primary, secondary, ghost
// ─────────────────────────────────────────────────────────
function Btn({ children, variant = 'primary', size = 'md', onClick, icon, style, full }) {
  const sz = size === 'sm' ? { h: 32, fs: 12, px: 12 } : size === 'lg' ? { h: 48, fs: 15, px: 18 } : { h: 40, fs: 13, px: 14 };
  const v = {
    primary:   { bg: APP.brand,   color: '#fff',     border: 'transparent' },
    secondary: { bg: APP.bgSoft,  color: APP.ink,    border: APP.border },
    ghost:     { bg: 'transparent', color: APP.ink2, border: 'transparent' },
    outline:   { bg: APP.surface, color: APP.ink,    border: APP.borderStrong },
    danger:    { bg: APP.dangerSoft, color: APP.danger, border: 'transparent' },
  }[variant];
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
      {icon}
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Toggle (settings)
// ─────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 44, height: 26, borderRadius: 999, padding: 2,
      background: on ? APP.brand : APP.borderStrong,
      border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center',
      justifyContent: on ? 'flex-end' : 'flex-start',
      transition: 'background 0.18s, justify-content 0.18s',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'all 0.18s',
      }}/>
    </button>
  );
}

Object.assign(window, {
  AppIcon, TASK_ICON, Card, SectionTitle, Pill, StatusDot,
  Sparkline, BarChart, RingGauge, MiniWatchFace, KidAvatar,
  IconBadge, BottomTabs, TABS, AppHeader, Btn, Toggle,
});
