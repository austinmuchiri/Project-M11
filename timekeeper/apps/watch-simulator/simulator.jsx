// TimeKeeper watch simulator — pixel-faithful browser stand-in for the
// LVGL firmware screens. Used for live demo when the actual watch hw
// isn't on stage. Mirrors apps/firmware/main/ui/*.c.

const { useEffect, useRef, useState } = React;

const WW = 410, WH = 502;

const LV = {
  bg: '#F4EFE6', bgSoft: '#EDE6DB', surface: '#FFFFFF',
  ink: '#2E2E33', ink2: '#56565E', inkDim: '#8A8A92', inkFaint: '#B6B6BC',
  brand: '#7FA38E', brandSoft: '#D7E4DB',
  accent: '#C99466', accentSoft: '#F1E2CF',
  warn: '#D69A55', warnSoft: '#F4E2C9',
  star: '#C99B3F', starSoft: '#F1E3C2',
  border: 'rgba(46,46,51,0.10)', borderStrong: 'rgba(46,46,51,0.18)',
  font:     `'Nunito Sans', system-ui, sans-serif`,
  fontDisp: `'Nunito', system-ui, sans-serif`,
  fontMono: `'JetBrains Mono', ui-monospace, monospace`,
};

// Inline icons — stroke-based, scale up well on AMOLED
function WI({ name, size = 80, color = LV.ink, sw = 3 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
              stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'brush':  return <svg {...p}><path d="M14 4l6 6-9 9-6-6z"/><path d="M3 21l3-3"/></svg>;
    case 'shirt':  return <svg {...p}><path d="M5 6l3-3 4 2 4-2 3 3-3 3v11H8V9z"/></svg>;
    case 'plate':  return <svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg>;
    case 'bag':    return <svg {...p}><path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>;
    case 'sun':    return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></svg>;
    case 'moon':   return <svg {...p}><path d="M21 13a8 8 0 1 1-10-10 6 6 0 0 0 10 10z"/></svg>;
    case 'star':   return <svg {...p}><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.6l1.1-6L3.4 9.4l6-.8z"/></svg>;
    case 'check':  return <svg {...p}><path d="M5 12l5 5 9-11"/></svg>;
    case 'bell':   return <svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
    case 'ble':    return <svg {...p}><path d="M7 7l10 10-5 4V3l5 4L7 17"/></svg>;
    case 'play':   return <svg {...p}><path d="M6 4l14 8-14 8z" fill={color} stroke="none"/></svg>;
    case 'pause':  return <svg {...p}><rect x="6" y="5" width="4" height="14" rx="1" fill={color} stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill={color} stroke="none"/></svg>;
    default:       return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

// Hardware bezel (rectangle with rounded corners + 2 side buttons)
function WatchBezel({ children, btn1, btn2, onBtn1, onBtn2 }) {
  return (
    <div style={{
      position: 'relative', padding: 12, background: '#0E1311', borderRadius: 38,
      boxShadow: 'inset 0 0 0 2px #1F2624, 0 12px 28px rgba(0,0,0,0.45)',
    }}>
      <button onClick={onBtn1} title={btn1} style={{
        position: 'absolute', right: -6, top: 90, width: 8, height: 50,
        background: '#1F2624', borderRadius: '0 4px 4px 0', border: 'none', cursor: 'pointer',
      }}/>
      <button onClick={onBtn2} title={btn2} style={{
        position: 'absolute', right: -6, top: 200, width: 8, height: 36,
        background: '#1F2624', borderRadius: '0 4px 4px 0', border: 'none', cursor: 'pointer',
      }}/>
      <div style={{
        position: 'absolute', right: -52, top: 100, fontSize: 9, color: 'rgba(244,239,230,0.55)',
        fontFamily: LV.fontMono, fontWeight: 700, letterSpacing: 0.5,
      }}>{btn1}</div>
      <div style={{
        position: 'absolute', right: -52, top: 208, fontSize: 9, color: 'rgba(244,239,230,0.55)',
        fontFamily: LV.fontMono, fontWeight: 700, letterSpacing: 0.5,
      }}>{btn2}</div>
      <div style={{
        width: WW, height: WH, borderRadius: 28, overflow: 'hidden',
        background: LV.bg, position: 'relative',
      }}>{children}</div>
    </div>
  );
}

function StatusBar({ time = '7:23', batt = 64, ble = true }) {
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
        <div style={{ width: 24, height: 12, borderRadius: 3, border: `1.5px solid ${LV.ink2}`, padding: 1.5 }}>
          <div style={{ width: `${batt}%`, height: '100%', background: LV.ink2, borderRadius: 1 }}/>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// Screens
// ────────────────────────────────────────

function ScrHome({ progress = 0.4 }) {
  const r = 94, c = 2 * Math.PI * r;
  return (
    <>
      <StatusBar/>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: LV.fontDisp, fontWeight: 800, fontSize: 96, color: LV.ink, lineHeight: 1, letterSpacing: -3 }}>
          {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </div>
        <div style={{ fontSize: 14, color: LV.inkDim, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 6 }}>Sun · Apr 25</div>
      </div>
      <div style={{ position: 'absolute', top: 184, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <svg width={210} height={210} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={105} cy={105} r={r} stroke={LV.brandSoft} strokeWidth={10} fill="none"/>
          <circle cx={105} cy={105} r={r} stroke={LV.brand} strokeWidth={10} fill="none"
                  strokeDasharray={c} strokeDashoffset={c * (1 - progress)} strokeLinecap="round"/>
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center', marginTop: 60 }}>
          <div style={{ fontFamily: LV.fontDisp, fontSize: 52, fontWeight: 800, color: LV.ink, lineHeight: 1, letterSpacing: -1 }}>
            {Math.round(progress * 5)}/5
          </div>
          <div style={{ fontSize: 13, color: LV.inkDim, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 }}>Morning</div>
        </div>
      </div>
      <div style={{
        position: 'absolute', left: 24, right: 24, bottom: 24, height: 78,
        borderRadius: 18, background: LV.surface,
        display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px',
        border: `1px solid ${LV.border}`,
      }}>
        <div style={{
          width: 50, height: 50, borderRadius: 14, background: LV.brandSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <WI name="shirt" size={28} color={LV.brand} sw={2.4}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: LV.inkDim, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>Next · 7:30</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: LV.ink, marginTop: 2 }}>Get Dressed</div>
        </div>
      </div>
    </>
  );
}

function ScrList() {
  const rows = [
    { time: '7:10', label: 'Brush Teeth', icon: 'brush', status: 'done' },
    { time: '7:20', label: 'Get Dressed', icon: 'shirt', status: 'active' },
    { time: '7:30', label: 'Breakfast',   icon: 'plate', status: 'pending' },
  ];
  return (
    <>
      <StatusBar/>
      <div style={{ position: 'absolute', top: 60, left: 24, right: 24 }}>
        <div style={{ fontFamily: LV.fontDisp, fontSize: 28, fontWeight: 800, color: LV.ink, letterSpacing: -0.5 }}>Today</div>
        <div style={{ fontSize: 14, color: LV.inkDim, fontWeight: 700, marginTop: 2 }}>2 of 5 done</div>
      </div>
      <div style={{ position: 'absolute', top: 140, left: 18, right: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map((t, i) => {
          const c = t.status === 'done' ? LV.brand : t.status === 'active' ? LV.accent : LV.inkDim;
          const bg = t.status === 'active' ? LV.brandSoft : LV.surface;
          return (
            <div key={i} style={{
              height: 102, borderRadius: 20, background: bg,
              border: t.status === 'active' ? `2px solid ${LV.brand}` : `1px solid ${LV.border}`,
              display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px',
            }}>
              <div style={{ width: 60, fontFamily: LV.fontMono, fontSize: 18, color: LV.ink2, fontWeight: 800 }}>{t.time}</div>
              <div style={{
                width: 60, height: 60, borderRadius: 16, background: c + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <WI name={t.icon} size={34} color={c} sw={2.4}/>
              </div>
              <div style={{
                flex: 1, fontSize: 22, fontWeight: 800, color: LV.ink,
                textDecoration: t.status === 'done' ? 'line-through' : 'none',
              }}>{t.label}</div>
              {t.status === 'done' && <WI name="check" size={28} color={LV.brand} sw={3}/>}
              {t.status === 'active' && <div style={{ width: 14, height: 14, borderRadius: 7, background: LV.accent }}/>}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ScrReminder({ task = 'Brush Teeth', icon = 'brush' }) {
  return (
    <>
      <StatusBar/>
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 210, height: 210, borderRadius: '50%', background: LV.brandSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `4px solid ${LV.brand}`,
          animation: 'tk-breathe 2.4s ease-in-out infinite',
        }}>
          <WI name={icon} size={120} color={LV.brand} sw={2.2}/>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 304, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: LV.inkDim, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase' }}>Time for</div>
        <div style={{ fontFamily: LV.fontDisp, fontSize: 36, fontWeight: 800, color: LV.ink, lineHeight: 1.05, marginTop: 4, letterSpacing: -0.5 }}>{task}</div>
      </div>
      <div style={{
        position: 'absolute', bottom: 28, left: 70, right: 70, height: 86,
        borderRadius: 22, background: LV.brand, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        fontFamily: LV.fontDisp, fontWeight: 800, fontSize: 26, letterSpacing: 1,
        boxShadow: `0 8px 0 0 ${LV.brand}55`,
      }}>
        <WI name="play" size={26} color="#fff"/>
        START
      </div>
    </>
  );
}

function ScrActive({ task = 'Brush Teeth', icon = 'brush', elapsedSec = 132 }) {
  const expected = 180;
  const pct = Math.min(1, elapsedSec / expected);
  const r = 112, c = 2 * Math.PI * r;
  const remain = Math.max(0, expected - elapsedSec);
  const m = Math.floor(remain / 60), s = remain % 60;
  return (
    <>
      <StatusBar/>
      <div style={{ position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 250, height: 250 }}>
          <svg width={250} height={250} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={125} cy={125} r={r} stroke={LV.bgSoft} strokeWidth={14} fill="none"/>
            <circle cx={125} cy={125} r={r} stroke={LV.brand} strokeWidth={14} fill="none"
                    strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: LV.fontDisp, fontWeight: 800, fontSize: 64, color: LV.ink, lineHeight: 1, letterSpacing: -2 }}>
              {m}:{String(s).padStart(2,'0')}
            </div>
            <div style={{ fontSize: 14, color: LV.inkDim, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 4 }}>of 3:00</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 348, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          padding: '6px 16px', borderRadius: 999, background: LV.brandSoft, color: LV.brand,
          fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8,
          textTransform: 'uppercase', letterSpacing: 1,
        }}>
          <WI name={icon} size={16} color={LV.brand} sw={2.4}/>
          {task}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, display: 'flex', gap: 14 }}>
        <div style={{
          flex: 1, height: 70, borderRadius: 18, background: LV.surface, border: `1.5px solid ${LV.borderStrong}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: LV.fontDisp, fontWeight: 800, fontSize: 18, color: LV.ink2,
        }}>
          <WI name="pause" size={20} color={LV.ink2}/>PAUSE
        </div>
        <div style={{
          flex: 1, height: 70, borderRadius: 18, background: LV.brand, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: LV.fontDisp, fontWeight: 800, fontSize: 20, letterSpacing: 1,
        }}>
          <WI name="check" size={22} color="#fff" sw={3.2}/>DONE
        </div>
      </div>
    </>
  );
}

// Confirm — interactive hold-to-fill arc; on full fill triggers onConfirm.
function ScrConfirm({ onConfirm }) {
  const [pct, setPct] = useState(0);
  const holding = useRef(false);
  const r = 132, c = 2 * Math.PI * r;

  useEffect(() => {
    let raf, last = 0;
    const step = (t) => {
      if (last === 0) last = t;
      const dt = (t - last) / 1000; last = t;
      setPct((p) => {
        if (holding.current) {
          const next = Math.min(1, p + dt / 0.9);
          if (next >= 1) { holding.current = false; onConfirm?.(); }
          return next;
        }
        return Math.max(0, p - dt * 1.6);
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onConfirm]);

  const onDown = () => { holding.current = true; };
  const onUp   = () => { holding.current = false; };

  return (
    <>
      <StatusBar/>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: LV.inkDim, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase' }}>Confirm</div>
      </div>
      <div onPointerDown={onDown} onPointerUp={onUp} onPointerLeave={onUp}
        style={{ position: 'absolute', top: 100, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ position: 'relative', width: 290, height: 290 }}>
          <svg width={290} height={290} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={145} cy={145} r={r} stroke={LV.brandSoft} strokeWidth={16} fill="none"/>
            <circle cx={145} cy={145} r={r} stroke={LV.brand} strokeWidth={16} fill="none"
                    strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <WI name="check" size={120} color={LV.brand} sw={2.6}/>
            <div style={{ fontFamily: LV.fontDisp, fontWeight: 800, fontSize: 22, color: LV.ink, marginTop: 6 }}>
              {pct < 0.05 ? 'Hold' : pct >= 1 ? 'Done!' : `${Math.round(pct*100)}%`}
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, textAlign: 'center', fontSize: 16, color: LV.ink2, fontWeight: 700 }}>
        Press &amp; hold the ring
      </div>
    </>
  );
}

function ScrReward() {
  return (
    <>
      <StatusBar/>
      <div style={{ position: 'absolute', top: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 200, height: 200, borderRadius: '50%', background: LV.starSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `4px solid ${LV.star}`,
          animation: 'tk-breathe 1.6s ease-in-out infinite',
        }}>
          <WI name="star" size={130} color={LV.star} sw={1.8}/>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 316, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: LV.fontDisp, fontSize: 36, fontWeight: 800, color: LV.ink, letterSpacing: -0.5 }}>Nice work!</div>
        <div style={{ fontSize: 16, color: LV.ink2, fontWeight: 700, marginTop: 6 }}>+1 star earned</div>
      </div>
      <div style={{ position: 'absolute', bottom: 26, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          padding: '10px 22px', borderRadius: 999, background: LV.brand, color: '#fff',
          fontFamily: LV.fontMono, fontSize: 18, fontWeight: 800,
        }}>
          ★ 184
        </div>
      </div>
    </>
  );
}

function ScrMissed() {
  return (
    <>
      <StatusBar/>
      <div style={{ position: 'absolute', top: 90, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 200, height: 200, borderRadius: '50%', background: LV.warnSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `4px solid ${LV.warn}`,
          animation: 'tk-pulse 2.4s ease-in-out infinite',
        }}>
          <WI name="bell" size={110} color={LV.warn} sw={2.4}/>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 304, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: LV.fontDisp, fontSize: 28, fontWeight: 800, color: LV.ink, letterSpacing: -0.4 }}>Let's try again</div>
        <div style={{ fontSize: 15, color: LV.ink2, fontWeight: 700, marginTop: 6 }}>Brush Teeth · still on the list</div>
      </div>
      <div style={{ position: 'absolute', bottom: 16, left: 24, right: 24, display: 'flex', gap: 14 }}>
        <div style={{
          flex: 1, height: 76, borderRadius: 18, background: LV.surface, border: `1.5px solid ${LV.borderStrong}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: LV.fontDisp, fontWeight: 800, fontSize: 18, color: LV.ink2,
        }}>SKIP</div>
        <div style={{
          flex: 1, height: 76, borderRadius: 18, background: LV.brand, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: LV.fontDisp, fontWeight: 800, fontSize: 18, letterSpacing: 1,
        }}>TRY AGAIN</div>
      </div>
    </>
  );
}

function ScrPair() {
  return (
    <>
      <StatusBar batt={64} ble={false}/>
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <svg width={200} height={200} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0, animation: 'tk-spin 2s linear infinite' }}>
            <circle cx={100} cy={100} r={92} stroke={LV.brandSoft} strokeWidth={4} fill="none"/>
            <circle cx={100} cy={100} r={92} stroke={LV.brand} strokeWidth={4} fill="none"
                    strokeDasharray={2*Math.PI*92} strokeDashoffset={2*Math.PI*92 * 0.7} strokeLinecap="round"/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WI name="ble" size={110} color={LV.brand} sw={2}/>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: LV.fontDisp, fontSize: 28, fontWeight: 800, color: LV.ink, letterSpacing: -0.4 }}>Pair with phone</div>
        <div style={{ fontSize: 14, color: LV.ink2, fontWeight: 700, marginTop: 6 }}>Open TimeKeeper → Devices → Pair</div>
      </div>
      <div style={{ position: 'absolute', top: 388, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          padding: '14px 28px', borderRadius: 14, background: LV.surface,
          border: `2px solid ${LV.brand}`, fontFamily: LV.fontMono, fontWeight: 800,
          fontSize: 30, color: LV.ink, letterSpacing: 8,
        }}>4 7 2 9</div>
      </div>
      <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 12, color: LV.inkDim, fontWeight: 700, fontFamily: LV.fontMono }}>
        BTN1 = cancel · BTN2 = re-broadcast
      </div>
    </>
  );
}

// ────────────────────────────────────────
// App shell — auto-play full task flow + manual nav
// ────────────────────────────────────────

const FLOW = [
  { id: 'pair',     label: '01 · Pair',      btn1: 'CANCEL',  btn2: 'RE-ADV' },
  { id: 'home',     label: '02 · Home',      btn1: 'WAKE',    btn2: 'MENU' },
  { id: 'list',     label: '03 · Today',     btn1: 'BACK',    btn2: 'SCROLL' },
  { id: 'reminder', label: '04 · Reminder',  btn1: 'SNOOZE',  btn2: 'START' },
  { id: 'active',   label: '05 · Active',    btn1: 'PAUSE',   btn2: 'DONE' },
  { id: 'confirm',  label: '06 · Confirm',   btn1: 'CANCEL',  btn2: 'HOLD' },
  { id: 'reward',   label: '07 · Reward',    btn1: 'OK',      btn2: 'OK' },
  { id: 'missed',   label: '08 · Missed',    btn1: 'SKIP',    btn2: 'RETRY' },
];

function App() {
  const [idx, setIdx] = useState(1); // start on Home
  const [autoPlay, setAutoPlay] = useState(false);
  const [elapsed, setElapsed] = useState(132);

  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % FLOW.length), 3500);
    return () => clearInterval(id);
  }, [autoPlay]);

  useEffect(() => {
    if (FLOW[idx].id !== 'active') { setElapsed(132); return; }
    const t = setInterval(() => setElapsed((e) => Math.min(180, e + 1)), 1000);
    return () => clearInterval(t);
  }, [idx]);

  const cur = FLOW[idx];

  const screen = (() => {
    switch (cur.id) {
      case 'home':     return <ScrHome progress={0.4}/>;
      case 'list':     return <ScrList/>;
      case 'reminder': return <ScrReminder/>;
      case 'active':   return <ScrActive elapsedSec={elapsed}/>;
      case 'confirm':  return <ScrConfirm onConfirm={() => setIdx(FLOW.findIndex(f => f.id === 'reward'))}/>;
      case 'reward':   return <ScrReward/>;
      case 'missed':   return <ScrMissed/>;
      case 'pair':     return <ScrPair/>;
      default:         return null;
    }
  })();

  return (
    <div style={{ minHeight: '100vh', padding: '24px 24px 60px' }}>
      {/* Header */}
      <div style={{ maxWidth: 1100, margin: '0 auto 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.6, color: 'rgba(244,239,230,0.6)' }}>
            Routine Tracker · Watch simulator
          </div>
          <div style={{ fontFamily: LV.fontDisp, fontSize: 28, fontWeight: 800, marginTop: 4, letterSpacing: -0.6 }}>
            Waveshare ESP32-S3-Touch-AMOLED-2.06
          </div>
          <div style={{ fontSize: 13, color: 'rgba(244,239,230,0.65)', marginTop: 2 }}>
            Browser stand-in for the LVGL firmware · 410 × 502 AMOLED · click side buttons to advance
          </div>
        </div>

        <button onClick={() => setAutoPlay(!autoPlay)} style={{
          padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: autoPlay ? LV.brand : 'rgba(244,239,230,0.08)',
          color: autoPlay ? '#fff' : '#F4EFE6', fontWeight: 800,
          fontSize: 13, fontFamily: LV.font,
        }}>
          {autoPlay ? '■ Stop auto-play' : '▶ Auto-play flow'}
        </button>
      </div>

      {/* Stage */}
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 320px', gap: 56,
        alignItems: 'start',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase',
            color: 'rgba(244,239,230,0.5)',
          }}>{cur.label}</div>
          <WatchBezel
            btn1={cur.btn1} btn2={cur.btn2}
            onBtn1={() => setIdx((i) => (i - 1 + FLOW.length) % FLOW.length)}
            onBtn2={() => setIdx((i) => (i + 1) % FLOW.length)}
          >
            {screen}
          </WatchBezel>
        </div>

        {/* Side panel — screen list */}
        <div style={{
          background: 'rgba(244,239,230,0.04)', border: '1px solid rgba(244,239,230,0.06)',
          borderRadius: 16, padding: 16,
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: '#A8C7B8', marginBottom: 10 }}>
            Screens
          </div>
          {FLOW.map((s, i) => (
            <button key={s.id} onClick={() => { setAutoPlay(false); setIdx(i); }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '10px 12px', marginBottom: 4,
              borderRadius: 8, border: 'none', cursor: 'pointer',
              background: i === idx ? 'rgba(168,199,184,0.15)' : 'transparent',
              color: i === idx ? '#A8C7B8' : 'rgba(244,239,230,0.8)',
              fontFamily: LV.font, fontSize: 13, fontWeight: i === idx ? 800 : 600,
              textAlign: 'left',
            }}>
              <span>{s.label}</span>
              {i === idx && <span style={{ fontSize: 10, fontFamily: LV.fontMono }}>▸</span>}
            </button>
          ))}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(244,239,230,0.08)' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: '#A8C7B8', marginBottom: 8 }}>
              Notes
            </div>
            <div style={{ fontSize: 12, color: 'rgba(244,239,230,0.7)', lineHeight: 1.5 }}>
              Side buttons cycle screens. The Confirm screen is interactive — press &amp; hold the ring 0.9s to advance to Reward.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
