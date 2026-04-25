// LVGL watch screens — 8 screens for Munene's task watch.
// Each screen is a 410×502 React component. Callouts annotate LVGL widget types.

// ────────────────────────────────────────
// 1. HOME / CLOCK FACE (idle)
// ────────────────────────────────────────
function ScrHome() {
  return (
    <AnnotatedScreen callouts={[
      { x: 24, y: 0,   w: 362, h: 44,  label: 'Status row',     code: 'lv_label × 3', color: LV.accent },
      { x: 60, y: 70,  w: 290, h: 96,  label: 'Time',           code: 'lv_label LARGE', color: LV.brand },
      { x: 100,y: 184, w: 210, h: 210, label: 'Progress arc',   code: 'lv_arc', color: LV.brand },
      { x: 24, y: 410, w: 362, h: 78,  label: 'Next-task card', code: 'lv_obj (panel)', color: LV.accent },
    ]}>
      <WatchStatusBar/>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: LV.fontDisp, fontWeight: 800, fontSize: 96, color: LV.ink, lineHeight: 1, letterSpacing: -3 }}>7:23</div>
        <div style={{ fontSize: 14, color: LV.inkDim, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 6 }}>Sun · Apr 25</div>
      </div>
      <div style={{ position: 'absolute', top: 184, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <svg width={210} height={210} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={105} cy={105} r={94} stroke={LV.brandSoft} strokeWidth={10} fill="none"/>
          <circle cx={105} cy={105} r={94} stroke={LV.brand} strokeWidth={10} fill="none"
                  strokeDasharray={2*Math.PI*94} strokeDashoffset={2*Math.PI*94 * (1 - 0.4)} strokeLinecap="round"/>
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center', marginTop: 60 }}>
          <div style={{ fontFamily: LV.fontDisp, fontSize: 52, fontWeight: 800, color: LV.ink, lineHeight: 1, letterSpacing: -1 }}>2/5</div>
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
    </AnnotatedScreen>
  );
}

// ────────────────────────────────────────
// 2. REMINDER (task starts — buzz)
// ────────────────────────────────────────
function ScrReminder() {
  return (
    <AnnotatedScreen callouts={[
      { x: 100, y: 80,  w: 210, h: 210, label: 'Task icon',    code: 'lv_image (canvas)', color: LV.brand },
      { x: 40,  y: 304, w: 330, h: 60,  label: 'Title label',  code: 'lv_label WRAP', color: LV.accent },
      { x: 70,  y: 388, w: 270, h: 86,  label: 'START button', code: 'lv_btn (Ø270)', color: LV.brand },
    ]}>
      <WatchStatusBar/>
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 210, height: 210, borderRadius: '50%', background: LV.brandSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `4px solid ${LV.brand}`,
          animation: 'breathe 2.4s ease-in-out infinite',
        }}>
          <WI name="brush" size={120} color={LV.brand} sw={2.2}/>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 304, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: LV.inkDim, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase' }}>Time for</div>
        <div style={{ fontFamily: LV.fontDisp, fontSize: 36, fontWeight: 800, color: LV.ink, lineHeight: 1.05, marginTop: 4, letterSpacing: -0.5 }}>Brush Teeth</div>
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
    </AnnotatedScreen>
  );
}

// ────────────────────────────────────────
// 3. ACTIVE (doing the task)
// ────────────────────────────────────────
function ScrActive() {
  return (
    <AnnotatedScreen callouts={[
      { x: 80,  y: 70,  w: 250, h: 250, label: 'Timer arc',    code: 'lv_arc + lv_label', color: LV.brand },
      { x: 70,  y: 348, w: 270, h: 30,  label: 'Task chip',    code: 'lv_obj pill', color: LV.accent },
      { x: 24,  y: 408, w: 168, h: 70,  label: 'Pause btn',    code: 'lv_btn', color: LV.accent },
      { x: 218, y: 408, w: 168, h: 70,  label: 'DONE btn',     code: 'lv_btn primary', color: LV.brand },
    ]}>
      <WatchStatusBar/>
      <div style={{ position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 250, height: 250 }}>
          <svg width={250} height={250} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={125} cy={125} r={112} stroke={LV.bgSoft} strokeWidth={14} fill="none"/>
            <circle cx={125} cy={125} r={112} stroke={LV.brand} strokeWidth={14} fill="none"
                    strokeDasharray={2*Math.PI*112} strokeDashoffset={2*Math.PI*112 * (1 - 0.62)} strokeLinecap="round"/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: LV.fontDisp, fontWeight: 800, fontSize: 64, color: LV.ink, lineHeight: 1, letterSpacing: -2 }}>2:12</div>
            <div style={{ fontSize: 14, color: LV.inkDim, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 4 }}>of 3:00</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 348, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          padding: '6px 16px', borderRadius: 999, background: LV.brandSoft, color: LV.brand,
          fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <WI name="brush" size={16} color={LV.brand} sw={2.4}/>
          BRUSH TEETH
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, display: 'flex', gap: 14 }}>
        <div style={{
          flex: 1, height: 70, borderRadius: 18, background: LV.surface, border: `1.5px solid ${LV.borderStrong}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: LV.fontDisp, fontWeight: 800, fontSize: 18, color: LV.ink2,
        }}>
          <WI name="pause" size={20} color={LV.ink2}/>
          PAUSE
        </div>
        <div style={{
          flex: 1, height: 70, borderRadius: 18, background: LV.brand, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: LV.fontDisp, fontWeight: 800, fontSize: 20, letterSpacing: 1,
        }}>
          <WI name="check" size={22} color="#fff" sw={3.2}/>
          DONE
        </div>
      </div>
    </AnnotatedScreen>
  );
}

// ────────────────────────────────────────
// 4. CONFIRM (hold-to-done)
// ────────────────────────────────────────
function ScrConfirm() {
  return (
    <AnnotatedScreen callouts={[
      { x: 60, y: 100, w: 290, h: 290, label: 'Hold ring (lv_arc)', code: 'lv_arc + anim 900ms', color: LV.brand },
      { x: 24, y: 416, w: 362, h: 60,  label: 'Hint label',          code: 'lv_label', color: LV.accent },
    ]}>
      <WatchStatusBar/>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: LV.inkDim, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase' }}>Confirm</div>
      </div>
      <div style={{ position: 'absolute', top: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 290, height: 290 }}>
          <svg width={290} height={290} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={145} cy={145} r={132} stroke={LV.brandSoft} strokeWidth={16} fill="none"/>
            <circle cx={145} cy={145} r={132} stroke={LV.brand} strokeWidth={16} fill="none"
                    strokeDasharray={2*Math.PI*132} strokeDashoffset={2*Math.PI*132 * (1 - 0.7)} strokeLinecap="round"/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <WI name="check" size={120} color={LV.brand} sw={2.6}/>
            <div style={{ fontFamily: LV.fontDisp, fontWeight: 800, fontSize: 22, color: LV.ink, marginTop: 6 }}>Hold</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, textAlign: 'center', fontSize: 16, color: LV.ink2, fontWeight: 700 }}>
        Keep holding to mark done
      </div>
    </AnnotatedScreen>
  );
}

// ────────────────────────────────────────
// 5. REWARD (★ +1)
// ────────────────────────────────────────
function ScrReward() {
  return (
    <AnnotatedScreen callouts={[
      { x: 105, y: 100, w: 200, h: 200, label: 'Star (lv_image)', code: 'lv_image + lv_anim', color: LV.star },
      { x: 60,  y: 316, w: 290, h: 90,  label: 'Praise label',     code: 'lv_label LARGE', color: LV.accent },
      { x: 130, y: 426, w: 150, h: 50,  label: 'Counter chip',     code: 'lv_obj pill', color: LV.brand },
    ]}>
      <WatchStatusBar/>
      <div style={{ position: 'absolute', top: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 200, height: 200, borderRadius: '50%', background: LV.starSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `4px solid ${LV.star}`,
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
    </AnnotatedScreen>
  );
}

// ────────────────────────────────────────
// 6. MISSED (gentle retry)
// ────────────────────────────────────────
function ScrMissed() {
  return (
    <AnnotatedScreen callouts={[
      { x: 105, y: 90,  w: 200, h: 200, label: 'Soft icon', code: 'lv_image (warn)', color: LV.warn },
      { x: 40,  y: 304, w: 330, h: 70,  label: 'Body label', code: 'lv_label', color: LV.accent },
      { x: 24,  y: 410, w: 168, h: 76,  label: 'Skip btn',   code: 'lv_btn ghost', color: LV.accent },
      { x: 218, y: 410, w: 168, h: 76,  label: 'Try again',  code: 'lv_btn primary', color: LV.brand },
    ]}>
      <WatchStatusBar/>
      <div style={{ position: 'absolute', top: 90, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 200, height: 200, borderRadius: '50%', background: LV.warnSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `4px solid ${LV.warn}`,
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
    </AnnotatedScreen>
  );
}

// ────────────────────────────────────────
// 7. TODAY'S TASK LIST (scrollable)
// ────────────────────────────────────────
const LIST_TASKS = [
  { time: '7:10', label: 'Brush Teeth', icon: 'brush', status: 'done' },
  { time: '7:20', label: 'Get Dressed', icon: 'shirt', status: 'active' },
  { time: '7:30', label: 'Breakfast',   icon: 'plate', status: 'pending' },
];

function ScrList() {
  return (
    <AnnotatedScreen callouts={[
      { x: 24, y: 60,  w: 362, h: 50,  label: 'Header label',  code: 'lv_label', color: LV.accent },
      { x: 14, y: 122, w: 382, h: 360, label: 'Task list',     code: 'lv_list', color: LV.brand },
    ]}>
      <WatchStatusBar/>
      <div style={{ position: 'absolute', top: 60, left: 24, right: 24 }}>
        <div style={{ fontFamily: LV.fontDisp, fontSize: 28, fontWeight: 800, color: LV.ink, letterSpacing: -0.5 }}>Today</div>
        <div style={{ fontSize: 14, color: LV.inkDim, fontWeight: 700, marginTop: 2 }}>2 of 5 done</div>
      </div>
      <div style={{ position: 'absolute', top: 140, left: 18, right: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {LIST_TASKS.map((t, i) => {
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
    </AnnotatedScreen>
  );
}

// ────────────────────────────────────────
// 8. BLE PAIRING
// ────────────────────────────────────────
function ScrPair() {
  return (
    <AnnotatedScreen callouts={[
      { x: 105, y: 80,  w: 200, h: 200, label: 'BLE icon (anim)', code: 'lv_image + arc spinner', color: LV.brand },
      { x: 40,  y: 296, w: 330, h: 70,  label: 'Status label',    code: 'lv_label', color: LV.accent },
      { x: 90,  y: 388, w: 230, h: 58,  label: 'Pair code',       code: 'lv_label MONO', color: LV.brand },
      { x: 24,  y: 462, w: 362, h: 30,  label: 'Tip',             code: 'lv_label small', color: LV.accent },
    ]}>
      <WatchStatusBar batt={64} ble={false}/>
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <svg width={200} height={200} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0, animation: 'spin 2s linear infinite' }}>
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
    </AnnotatedScreen>
  );
}

Object.assign(window, { ScrHome, ScrReminder, ScrActive, ScrConfirm, ScrReward, ScrMissed, ScrList, ScrPair, LIST_TASKS });
