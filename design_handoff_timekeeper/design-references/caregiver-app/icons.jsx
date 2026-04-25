// Simple inline SVG icons sized for 240x280 watch screens.
// All icons accept size + color, stroke-based for crispness.

const Icon = ({ children, size = 24, color = 'currentColor', fill = 'none', stroke = 2, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

const IconCheck = (p) => <Icon {...p}><polyline points="4 12 10 18 20 6"/></Icon>;
const IconX = (p) => <Icon {...p}><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></Icon>;
const IconStar = (p) => <Icon {...p} fill={p.fill ?? p.color ?? 'currentColor'}><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></Icon>;
const IconBook = (p) => <Icon {...p}><path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 4v13"/><path d="M19 17H7"/></Icon>;
const IconTooth = (p) => <Icon {...p}><path d="M7 3c-2 0-3 1.5-3 3.5 0 2 1 3 1 5 0 3 1 10 3 10 1.5 0 1.5-4 3-4s1.5 4 3 4c2 0 3-7 3-10 0-2 1-3 1-5 0-2-1-3.5-3-3.5-1.5 0-2.5 1-4 1s-2.5-1-4-1z"/></Icon>;
const IconBed = (p) => <Icon {...p}><path d="M3 18v-6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6"/><path d="M3 14h18"/><path d="M3 20v-2"/><path d="M21 20v-2"/><circle cx="8" cy="11.5" r="1.5"/></Icon>;
const IconBowl = (p) => <Icon {...p}><path d="M3 11h18"/><path d="M4 11v2a8 8 0 0 0 16 0v-2"/><path d="M9 7c0-1 .5-2 1.5-2s1.5 1 1.5 2-1 1.5-1 2.5"/></Icon>;
const IconBroom = (p) => <Icon {...p}><path d="M14 3l-6 8"/><path d="M8 11l5 5"/><path d="M4 20l5-5 5 5-2 1H5z"/></Icon>;
const IconRun = (p) => <Icon {...p}><circle cx="13" cy="5" r="2"/><path d="M7 22l3-7 4 2 1 5"/><path d="M10 15l-2-4 5-3 4 3-2 4"/></Icon>;
const IconPill = (p) => <Icon {...p}><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-30 12 12)"/><line x1="8.5" y1="7.5" x2="15.5" y2="15.5" transform="rotate(-30 12 12)"/></Icon>;
const IconBell = (p) => <Icon {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></Icon>;
const IconPlay = (p) => <Icon {...p} fill={p.fill ?? p.color ?? 'currentColor'}><polygon points="7 4 20 12 7 20"/></Icon>;
const IconPause = (p) => <Icon {...p} fill={p.fill ?? p.color ?? 'currentColor'} stroke="none"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></Icon>;
const IconSparkle = (p) => <Icon {...p}><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="M6 6l2.5 2.5"/><path d="M15.5 15.5L18 18"/><path d="M6 18l2.5-2.5"/><path d="M15.5 8.5L18 6"/></Icon>;
const IconHeart = (p) => <Icon {...p} fill={p.fill ?? 'none'}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></Icon>;

Object.assign(window, {
  IconCheck, IconX, IconStar, IconBook, IconTooth, IconBed, IconBowl, IconBroom,
  IconRun, IconPill, IconBell, IconPlay, IconPause, IconSparkle, IconHeart
});
