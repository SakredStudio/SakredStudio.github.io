import { DROPS, type Drop } from "../data/drops";
import { APP_NAME } from "../theme";
import { getIdol } from "../lib/groups";
import { getDays, liveDrops, type DropStatus } from "../lib/drops";
import { preorderUrl, albumSearchUrl } from "../lib/affiliate";
import { track } from "../lib/beacon";
import { todaysBirthdays, upcomingBirthdays, formatMonthDay } from "../lib/birthdays";
import { Lbl, IdolTag, ColorBar } from "../components/ui";
import type { AppState } from "../state/useSwaiyu";

type Live = { item: Drop; status: DropStatus };

// Home = wordmark + followed groups, a countdown hero (nearest comeback for a followed
// group, or the saved concert if that is sooner), then every live release with a
// Pre-order (upcoming) or Listen (released) button. Step 3 of BUILD-PLAN-V2.md.
export function Home({app}: {app: AppState}) {
  const { myIdols, myIdolData, savedEvent, setTab, setShowPicker, heroGradient } = app;
  const all = liveDrops(DROPS);
  const nextDrop = all.find(x => x.status.upcoming && !!x.item.idol && myIdols.includes(x.item.idol)) ?? null;
  const concertDays = savedEvent ? getDays(savedEvent.date) : null;
  const concertLive = !!savedEvent && concertDays != null && concertDays >= 0;
  const concertIsHero = concertLive && (!nextDrop || (concertDays as number) <= nextDrop.status.days);

  const jumpTo = (d: Drop) => {
    track("hero_tap");
    document.getElementById(dropId(d))?.scrollIntoView({behavior: "smooth", block: "center"});
  };

  return (
    <div style={{overflowY:"auto",paddingBottom:90}}>
      <div style={{padding:"52px 22px 18px",position:"relative"}}>
        <Lbl>Your K-Pop Universe</Lbl>
        <div className="h1" style={{fontSize:44,marginBottom:6,display:"inline-block",backgroundImage:heroGradient,WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",color:"transparent"}}>{APP_NAME}</div>
        <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
          {myIdolData.map(idol => (
            <div key={idol.id} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:20,background:`${idol.color}14`,border:`1px solid ${idol.color}28`}}>
              <span style={{fontSize:14}}>{idol.emoji}</span>
              <span style={{fontSize:13,fontWeight:700,color:idol.color}}>{idol.name}</span>
            </div>
          ))}
          <div className="tap" onClick={() => setShowPicker(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",minHeight:40,borderRadius:20,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",cursor:"pointer"}}>
            <span style={{fontSize:13,color:"rgba(255,255,255,.6)"}}>+ Edit</span>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      {concertIsHero && savedEvent ? (
        <ConcertHero app={app} days={concertDays as number}/>
      ) : nextDrop ? (
        <DropHero live={nextDrop} onTap={() => jumpTo(nextDrop.item)}/>
      ) : (
        <div className="tap fade card" onClick={() => setShowPicker(true)} style={{margin:"0 20px 14px",padding:"18px",display:"flex",gap:14,alignItems:"center",border:"1.5px dashed rgba(192,132,252,.25)"}}>
          <div style={{fontSize:30}}>✨</div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:2}}>No comebacks on the radar</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.6)"}}>Follow more groups →</div>
          </div>
          <div style={{fontSize:20,color:"rgba(255,255,255,.4)"}}>›</div>
        </div>
      )}

      {/* Saved concert as a compact row when a comeback took the hero slot */}
      {concertLive && !concertIsHero && savedEvent && (() => {
        const g = getIdol(savedEvent.idol);
        const c = g?.color ?? "#7c3aed";
        return (
          <div className="tap fade" onClick={() => setTab("concerts")} style={{margin:"0 20px 14px",padding:"12px 16px",borderRadius:16,background:`${c}12`,border:`1px solid ${c}28`,display:"flex",gap:12,alignItems:"center",minHeight:56}}>
            <div style={{fontSize:22}}>🎟</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g?.name ?? "My concert"} · {concertDays === 0 ? "today 🎉" : `in ${concertDays} days`}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.6)"}}>Tap for your prep kit</div>
            </div>
            <div style={{fontSize:20,color:"rgba(255,255,255,.4)"}}>›</div>
          </div>
        );
      })()}

      {!savedEvent && (
        <div className="tap fade" onClick={() => setTab("concerts")} style={{margin:"0 20px 14px",padding:"12px 16px",borderRadius:16,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",display:"flex",gap:12,alignItems:"center",minHeight:56}}>
          <div style={{fontSize:22}}>🎟</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700}}>Going to a show? Save it</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.6)"}}>Countdown, tickets and a prep checklist</div>
          </div>
          <div style={{fontSize:20,color:"rgba(255,255,255,.4)"}}>›</div>
        </div>
      )}

      <Birthdays myIdols={myIdols}/>

      {/* ── RELEASES ── */}
      <div style={{padding:"8px 22px 10px"}}><Lbl>📅 Releases</Lbl></div>
      <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:11,paddingBottom:24}}>
        {all.length === 0 ? (
          <div style={{borderRadius:16,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",padding:"28px 18px",textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>No releases on the radar right now 🎵</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.6)",lineHeight:1.5}}>Check back soon. New comebacks get added as they are announced.</div>
          </div>
        ) : all.map((live, i) => <DropCard key={dropId(live.item)} live={live} index={i} mine={!!live.item.idol && myIdols.includes(live.item.idol)}/>)}
      </div>
    </div>
  );
}

// "Today 🎂" across the whole catalog (followed first) + the next three among followed groups.
function Birthdays({myIdols}: {myIdols: string[]}) {
  const today = todaysBirthdays(myIdols);
  const next = upcomingBirthdays(myIdols, 3);
  return (
    <div style={{padding:"0 20px 14px"}}>
      <div className="card fade" style={{padding:"14px 16px"}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>🎂 Today</div>
        {today.length === 0 ? (
          <div style={{fontSize:13,color:"rgba(255,255,255,.6)"}}>No birthdays today</div>
        ) : (
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {today.map(b => {
              const c = b.idol?.color ?? "#7c3aed";
              return (
                <span key={`${b.groupId}-${b.member}`} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 12px",minHeight:38,borderRadius:20,background:`${c}22`,border:`1px solid ${c}44`,fontSize:13,fontWeight:700,color:"#fff"}}>
                  {b.idol?.emoji ?? "🎤"} {b.member}
                  <span style={{color:"rgba(255,255,255,.65)",fontWeight:500}}>{b.idol?.name ?? b.groupId}</span>
                </span>
              );
            })}
          </div>
        )}
        {next.length > 0 && (
          <>
            <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,.7)",margin:"14px 0 4px"}}>Next up</div>
            {next.map(b => {
              const c = b.idol?.color ?? "#7c3aed";
              return (
                <div key={`${b.groupId}-${b.member}`} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderTop:"1px solid rgba(255,255,255,.06)"}}>
                  <span style={{fontSize:20,width:28,textAlign:"center"}}>{b.idol?.emoji ?? "🎤"}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700}}>{b.member}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,.6)"}}>{b.idol?.name ?? b.groupId} · {formatMonthDay(b.date)}</div>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:c,padding:"6px 10px",borderRadius:18,background:`${c}18`,whiteSpace:"nowrap"}}>{b.daysUntil === 1 ? "tomorrow" : `in ${b.daysUntil} days`}</span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

const dropId = (d: Drop) => `drop-${d.date}-${d.artist}-${d.title}`.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();

function DropHero({live, onTap}: {live: Live; onTap: () => void}) {
  const { item: d, status } = live;
  const idol = d.idol ? getIdol(d.idol) : null;
  const c = idol?.color ?? "#7c3aed";
  const n = status.days;
  return (
    <div className="tap shimmer fade" onClick={onTap} style={{margin:"0 20px 14px",borderRadius:20,background:`linear-gradient(135deg,${c}26,rgba(255,255,255,.03))`,border:`1px solid ${c}40`,padding:"18px 20px",overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,borderRadius:"50%",background:`${c}14`}}/>
      <div style={{fontSize:13,fontWeight:700,color:c,marginBottom:6}}>{idol?.emoji} Next comeback · {idol?.name ?? d.artist}</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:10,marginBottom:6}}>
        {n === 0 ? (
          <div className="h1" style={{fontSize:40,color:c,lineHeight:1}}>Today 🎉</div>
        ) : (
          <>
            <div className="h1" style={{fontSize:64,color:c,lineHeight:1}}>{n}</div>
            <div style={{fontSize:14,color:"rgba(255,255,255,.7)",marginBottom:10}}>{n === 1 ? "day to go" : "days to go"}</div>
          </>
        )}
      </div>
      <div style={{fontSize:18,fontWeight:700,marginBottom:2}}>{d.title}</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,.6)",marginBottom:14}}>{d.artist} · {d.type} · {d.date}</div>
      <a href={preorderUrl(d.artist, d.title)} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex"}} onClick={e => { e.stopPropagation(); track("preorder_click"); }}>
        <div className="tap" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"12px 18px",minHeight:44,borderRadius:12,background:c,color:"#fff",fontSize:14,fontWeight:700,boxShadow:`0 6px 20px ${c}55`}}>Pre-order ↗</div>
      </a>
    </div>
  );
}

function ConcertHero({app, days}: {app: AppState; days: number}) {
  const { savedEvent, setTab } = app;
  if (!savedEvent) return null;
  const g = getIdol(savedEvent.idol);
  const c = g?.color ?? "#7c3aed";
  const where = [savedEvent.venue, savedEvent.city].filter(Boolean).join(" · ");
  return (
    <div className="tap shimmer fade" onClick={() => setTab("concerts")} style={{margin:"0 20px 14px",borderRadius:20,background:`linear-gradient(135deg,${c}26,rgba(255,255,255,.03))`,border:`1px solid ${c}40`,padding:"18px 20px",overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,borderRadius:"50%",background:`${c}14`}}/>
      <div style={{fontSize:13,fontWeight:700,color:c,marginBottom:6}}>🎟 My concert · tap for the full kit</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:10,marginBottom:6}}>
        <div className="h1" style={{fontSize:64,color:c,lineHeight:1}}>{days}</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,.7)",marginBottom:10}}>{days === 1 ? "day to go" : "days to go"}</div>
      </div>
      <div style={{fontSize:18,fontWeight:700,marginBottom:2}}>{g?.name ?? "My Concert"} {g?.emoji ?? "🎵"}</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,.6)"}}>{where || new Date(savedEvent.date).toDateString()}</div>
      {days <= 14 && <div style={{marginTop:12,display:"inline-flex",gap:6,alignItems:"center",padding:"8px 14px",borderRadius:20,background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.22)",color:"#ef4444",fontSize:13,fontWeight:700}}><div className="live-dot"/> Prep kit time</div>}
    </div>
  );
}

function DropCard({live, index, mine}: {live: Live; index: number; mine: boolean}) {
  const { item: d, status } = live;
  const idol = d.idol ? getIdol(d.idol) : null;
  const c = idol?.color ?? "#6b7280";
  const primary = status.upcoming
    ? { label: "Pre-order ↗", href: preorderUrl(d.artist, d.title), ev: "preorder_click" }
    : { label: "Listen ↗", href: d.ytUrl ?? albumSearchUrl(d.artist, d.title), ev: "listen_click" };
  const secondary = status.upcoming
    ? (d.ytUrl ? { label: "Teasers ↗", href: d.ytUrl, ev: "listen_click" } : null)
    : { label: "Buy album ↗", href: albumSearchUrl(d.artist, d.title), ev: "preorder_click" };
  return (
    <div id={dropId(d)} className="card fade" style={{animationDelay:`${index*.04}s`,overflow:"hidden",border:mine ? `1px solid ${c}40` : undefined}}>
      <ColorBar color={c}/>
      <div style={{padding:"14px 14px 12px"}}>
        <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}>
          <div style={{width:44,height:44,borderRadius:12,background:`${c}16`,border:`1px solid ${c}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
            {status.days === 0 ? "🔴" : status.upcoming ? "📅" : "🎵"}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
              <span style={{fontSize:16,fontWeight:700}}>{d.title}</span>
              {!status.upcoming && status.label === "New" && <span style={{fontSize:12,padding:"2px 8px",borderRadius:18,background:"rgba(239,68,68,.18)",color:"#ef4444",fontWeight:700}}>NEW</span>}
            </div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.6)"}}>{d.artist} · {d.type} · {d.date}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <a href={primary.href} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex"}} onClick={() => track(primary.ev)}>
            <div className="tap" style={{display:"inline-flex",alignItems:"center",padding:"10px 16px",minHeight:44,borderRadius:12,background:status.upcoming ? c : `${c}22`,color:status.upcoming ? "#fff" : (idol ? c : "#fff"),fontSize:14,fontWeight:700}}>{primary.label}</div>
          </a>
          {secondary && (
            <a href={secondary.href} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex"}} onClick={() => track(secondary.ev)}>
              <div className="tap" style={{display:"inline-flex",alignItems:"center",padding:"10px 12px",minHeight:44,borderRadius:12,color:"rgba(255,255,255,.7)",fontSize:13,fontWeight:700}}>{secondary.label}</div>
            </a>
          )}
          <span style={{marginLeft:"auto",fontSize:12,padding:"6px 10px",borderRadius:18,background:status.upcoming ? "rgba(255,255,255,.06)" : `${c}14`,color:status.upcoming ? "rgba(255,255,255,.7)" : c,fontWeight:700}}>{status.label}</span>
        </div>
        {idol && <div style={{marginTop:8}}><IdolTag idol={idol}/></div>}
      </div>
    </div>
  );
}
