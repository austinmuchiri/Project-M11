// LVGL watch screens for Waveshare ESP32-S3-Touch-AMOLED-2.06
// Display: 410×502px AMOLED (rectangular, rounded corners), capacitive touch
// Hardware: 2 side buttons + touch
// Aesthetic: V2 "Calm" — sage / off-white / soft charcoal — matches caregiver app
//
// Each screen is rendered at native pixel size and annotated with LVGL widget
// callouts (lv_obj_t names) so a firmware developer can map 1:1.

const WW = 410, WH = 502;

// Calm palette mapped to LVGL color tokens
const LV = {
  bg:        '#F4EFE6',     // lv_obj_set_style_bg_color(scr, ...)
  bgSoft:    '#EDE6DB',
  surface:   '#FFFFFF',
  ink:       '#2E2E33',     // primary text
  ink2:      '#56565E',
  inkDim:    '#8A8A92',
  inkFaint:  '#B6B6BC',
  brand:     '#7FA38E',     // sage — primary
  brandSoft: '#D7E4DB',
  accent:    '#C99466',
  accentSoft:'#F1E2CF',
  warn:      '#D69A55',
  warnSoft:  '#F4E2C9',
  star:      '#C99B3F',
  starSoft:  '#F1E3C2',
  border:    'rgba(46,46,51,0.10)',
  borderStrong: 'rgba(46,46,51,0.18)',
  font:      `'Nunito Sans', system-ui, sans-serif`,
  fontDisp:  `'Nunito', system-ui, sans-serif`,
  fontMono:  `'JetBrains Mono', ui-monospace, monospace`,
};

// ────────────────────────────────────────
// Watch hardware bezel — AMOLED on a flat dev board
// ────────────────────────────────────────
function WatchBezel({ children, label, btn1Label = 'BTN1', btn2Label = 'BTN2' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{
        fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase',
        color: 'rgba(244,239,230,0.5)', textAlign: 'center',
      }}>{label}</div>
      <div style={{
        position: 'relative',
        padding: 12,
        background: '#0E1311',
        borderRadius: 38,
        boxShadow: 'inset 0 0 0 2px #1F2624, 0 12px 28px rgba(0,0,0,0.35)',
      }}>
        {/* Side buttons */}
        <div style={{
          position: 'absolute', right: -6, top: 90, width: 6, height: 50,
          background: '#1F2624', borderRadius: '0 4px 4px 0',
        }}/>
        <div style={{
          position: 'absolute', right: -6, top: 200, width: 6, height: 36,
          background: '#1F2624', borderRadius: '0 4px 4px 0',
        }}/>
        <div style={{
          position: 'absolute', right: -22, top: 100, fontSize: 9, color: 'rgba(244,239,230,0.55)',
          fontFamily: LV.fontMono, fontWeight: 700, letterSpacing: 0.5,
        }}>{btn1Label}</div>
        <div style={{
          position: 'absolute', right: -22, top: 208, fontSize: 9, color: 'rgba(244,239,230,0.55)',
          fontFamily: LV.fontMono, fontWeight: 700, letterSpacing: 0.5,
        }}>{btn2Label}</div>

        {/* AMOLED active area (note: 410x502 is the panel spec) */}
        <div style={{
          width: WW, height: WH, borderRadius: 28, overflow: 'hidden',
          background: LV.bg, position: 'relative',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// Status bar (used inside each screen)
// LVGL: top-row strip — lv_label x2 (time, battery)
// ────────────────────────────────────────
function WatchStatusBar({ time = '7:23', batt = 64, ble = true }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 44,
      padding: '14px 24px 0', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center',
      fontFamily: LV.fontMono, fontSize: 14, fontWeight: 700,
      color: LV.ink2, zIndex: 5,
    }}>
      <span>{time}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {ble && <span style={{ fontSize: 11, color: LV.brand }}>● BLE</span>}
        <span>{batt}%</span>
        <div style={{
          width: 24, height: 12, borderRadius: 3,
          border: `1.5px solid ${LV.ink2}`, padding: 1.5,
        }}>
          <div style={{ width: `${batt}%`, height: '100%', background: LV.ink2, borderRadius: 1 }}/>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// Task icons (line art, scale up well at 410×502)
// ────────────────────────────────────────
function WI({ name, size = 80, color = LV.ink, sw = 3 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
              stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'brush':  return <svg {...p}><path d="M14 4l6 6-9 9-6-6z"/><path d="M3 21l3-3"/></svg>;
    case 'shirt':  return <svg {...p}><path d="M5 6l3-3 4 2 4-2 3 3-3 3v11H8V9z"/></svg>;
    case 'plate':  return <svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg>;
    case 'bag':    return <svg {...p}><path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>;
    case 'book':   return <svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z"/><path d="M4 5v15"/></svg>;
    case 'sun':    return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></svg>;
    case 'moon':   return <svg {...p}><path d="M21 13a8 8 0 1 1-10-10 6 6 0 0 0 10 10z"/></svg>;
    case 'star':   return <svg {...p}><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.6l1.1-6L3.4 9.4l6-.8z"/></svg>;
    case 'check':  return <svg {...p}><path d="M5 12l5 5 9-11"/></svg>;
    case 'x':      return <svg {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'bell':   return <svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
    case 'ble':    return <svg {...p}><path d="M7 7l10 10-5 4V3l5 4L7 17"/></svg>;
    case 'play':   return <svg {...p}><path d="M6 4l14 8-14 8z" fill={color} stroke="none"/></svg>;
    case 'pause':  return <svg {...p}><rect x="6" y="5" width="4" height="14" rx="1" fill={color} stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill={color} stroke="none"/></svg>;
    default:       return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

// ────────────────────────────────────────
// Annotation pill — a callout pointing to a widget
// ────────────────────────────────────────
function Callout({ x, y, w, h, label, code, side = 'right', color = '#C99466' }) {
  const isRight = side === 'right';
  const lineX = isRight ? x + w : x;
  const tipY = y + h/2;
  const tagX = isRight ? x + w + 28 : x - 28;
  return (
    <>
      {/* outline box */}
      <div style={{
        position: 'absolute', left: x, top: y, width: w, height: h,
        border: `1.5px dashed ${color}`, borderRadius: 6,
        pointerEvents: 'none',
      }}/>
      {/* connector */}
      <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <line x1={lineX} y1={tipY} x2={tagX} y2={tipY} stroke={color} strokeWidth="1.2" strokeDasharray="3 3"/>
        <circle cx={lineX} cy={tipY} r="3" fill={color}/>
      </svg>
      {/* tag */}
      <div style={{
        position: 'absolute', left: isRight ? tagX : 'auto', right: isRight ? 'auto' : (WW - tagX),
        top: tipY - 18, transform: isRight ? 'none' : 'translateX(-100%)',
        background: '#1F2E27', color: '#F4EFE6',
        padding: '6px 10px', borderRadius: 6,
        fontFamily: LV.fontMono, fontSize: 11, fontWeight: 700,
        whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      }}>
        <div style={{ color, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
        <div>{code}</div>
      </div>
    </>
  );
}

// Wrap a screen + its callouts in a frame that is 2× the screen wide so callouts have room
function AnnotatedScreen({ children, callouts = [] }) {
  return (
    <div style={{ position: 'relative', width: WW + 280, height: WH, marginLeft: 0 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: WW, height: WH }}>
        {children}
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: WW + 280, height: WH }}>
        {callouts.map((c, i) => <Callout key={i} {...c}/>)}
      </div>
    </div>
  );
}

Object.assign(window, { WW, WH, LV, WatchBezel, WatchStatusBar, WI, Callout, AnnotatedScreen });
