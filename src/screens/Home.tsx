import { DROPS } from "../data/drops";
import { APP_NAME } from "../theme";
import { getIdol } from "../lib/groups";
import { getDays, liveDrops } from "../lib/drops";
import { Lbl, IdolTag, ColorBar } from "../components/ui";
import type { AppState } from "../state/useSwaiyu";

// Home = hero + saved-concert countdown + followed-group drops + every live drop.
// (v1's Drops tab is folded in here; the quick-action grid and FANI promo are gone.)
export function Home({app}: {app: AppState}) {
  const { myIdols, myIdolData, savedEvent, setTab, setShowPicker, heroGradient } = app;
  const event = savedEvent;
  const eventIdol = event ? getIdol(event.idol) : null;
  const eventColor = eventIdol?.color ?? "#7c3aed";
  const days = event ? getDays(event.date) : null;
  const eventWhere = event ? [event.venue, event.city].filter(Boolean).join(" · ") : "";
  // Same live filter/sort/expiry everywhere, scoped to the user's groups for the row.
  const myDrops = liveDrops(DROPS.filter(d => !d.idol || myIdols.includes(d.idol)));
  const allDrops = liveDrops(DROPS);

  return (
    <div style={{overflowY:"auto",paddingBottom:90}}>
      <div style={{padding:"52px 22px 20px",position:"relative"}}>
        <Lbl>Your K-Pop Universe</Lbl>
        <div className="h1" style={{fontSize:44,marginBottom:6,display:"inline-block",backgroundImage:heroGradient,WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",color:"transparent"}}>{APP_NAME}</div>
        <div className="sans" style={{fontSize:13,color:"rgba(255,255,255,.38)",lineHeight:1.6}}>Comebacks · Concerts · Fan Card · FANI</div>
        <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
          {myIdolData.map(idol => (
            <div key={idol.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,background:`${idol.color}14`,border:`1px solid ${idol.color}28`}}>
              <span style={{fontSize:14}}>{idol.emoji}</span>
              <span style={{fontSize:11,fontWeight:700,color:idol.color,fontFamily:"'Space Mono'"}}>{idol.name}</span>
            </div>
          ))}
          <div className="tap" onClick={() => setShowPicker(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",cursor:"pointer"}}>
            <span style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>+ Edit</span>
          </div>
        </div>
      </div>

      {event ? (
        <div className="tap shimmer fade" onClick={() => setTab("concerts")} style={{margin:"0 20px 18px",borderRadius:22,background:`linear-gradient(135deg,${eventColor}1a,rgba(255,255,255,.03))`,border:`1px solid ${eventColor}30`,padding:"18px 20px",overflow:"hidden",position:"relative"}}>
          <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:`${eventColor}0d`}}/>
          <Lbl style={{color:eventColor}}>🎟 My Concert · Tap for Full Kit</Lbl>
          <div style={{display:"flex",alignItems:"flex-end",gap:10,marginBottom:8}}>
            <div className="h1" style={{fontSize:64,color:eventColor,lineHeight:1}}>{days != null ? Math.max(days, 0) : "—"}</div>
            <div className="sans" style={{fontSize:14,color:"rgba(255,255,255,.4)",marginBottom:10}}>days to go</div>
          </div>
          <div style={{fontSize:15,fontWeight:700,marginBottom:3}}>{eventIdol?.name ?? "My Concert"} {eventIdol?.emoji ?? "🎵"}</div>
          <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)"}}>{eventWhere || new Date(event.date).toDateString()}</div>
          {days != null && days >= 0 && days <= 14 && <div style={{marginTop:10,display:"inline-flex",gap:6,alignItems:"center",padding:"6px 13px",borderRadius:20,background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.22)",color:"#ef4444",fontSize:11,fontFamily:"'Space Mono'",fontWeight:700}}><div className="live-dot"/> {days}d — Concert Kit urgent!</div>}
        </div>
      ) : (
        <div className="tap fade card" onClick={() => setTab("concerts")} style={{margin:"0 20px 18px",padding:"16px 18px",display:"flex",gap:14,alignItems:"center",border:"1.5px dashed rgba(192,132,252,.2)"}}>
          <div style={{fontSize:30}}>🎟</div>
          <div><div style={{fontSize:13,fontWeight:700,marginBottom:2}}>Save a Concert → Get Your Prep Kit</div><div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>Checklist, tickets, merch — all in one</div></div>
          <div style={{marginLeft:"auto",fontSize:20,color:"rgba(255,255,255,.18)"}}>›</div>
        </div>
      )}

      <div style={{padding:"0 22px 10px"}}><Lbl>🎵 My Group Drops</Lbl></div>
      {myDrops.length > 0 ? (
        <div className="hrow" style={{padding:"0 20px 18px"}}>
          {myDrops.slice(0, 6).map(({item: d, status}, i) => {
            const idol = d.idol ? getIdol(d.idol) : null;
            return (
              <div key={i} className="tap" onClick={() => d.ytUrl && window.open(d.ytUrl, "_blank")} style={{flexShrink:0,width:140,borderRadius:16,background:idol ? `${idol.color}14` : "rgba(255,255,255,.05)",border:`1px solid ${idol ? idol.color+"28" : "rgba(255,255,255,.07)"}`,padding:"12px 12px 10px"}}>
                <div style={{fontSize:9,color:idol ? idol.color : "rgba(255,255,255,.35)",fontFamily:"'Space Mono'",letterSpacing:".07em",marginBottom:3}}>{d.type.toUpperCase()}</div>
                <div style={{fontSize:12,fontWeight:700,lineHeight:1.2,marginBottom:3}}>{d.title}</div>
                <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.38)",marginBottom:7}}>{d.artist}</div>
                <div style={{fontSize:10,color:status.days === 0 ? "#ef4444" : status.upcoming ? "rgba(255,255,255,.3)" : idol ? idol.color : "#22c55e",fontFamily:"'Space Mono'"}}>{status.days === 0 ? "🔴 TODAY" : status.label}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="tap" onClick={() => setShowPicker(true)} style={{margin:"0 20px 18px",padding:"16px 18px",borderRadius:16,background:"linear-gradient(135deg,rgba(124,58,237,.12),rgba(244,114,182,.06))",border:"1px solid rgba(192,132,252,.2)",display:"flex",gap:13,alignItems:"center"}}>
          <div style={{fontSize:26,flexShrink:0}}>✨</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>No comebacks on the radar for your groups</div>
            <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.45)",lineHeight:1.5}}>Follow more groups →</div>
          </div>
          <div style={{fontSize:18,color:"rgba(255,255,255,.2)"}}>›</div>
        </div>
      )}

      <div style={{padding:"0 22px 10px"}}><Lbl>📅 All Upcoming Releases</Lbl></div>
      <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:11,paddingBottom:24}}>
        {allDrops.length === 0 ? (
          <div style={{borderRadius:18,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",padding:"28px 18px",textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>No releases on the radar right now 🎵</div>
            <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.4)",lineHeight:1.5}}>Check back soon — new comebacks get added as they're announced.</div>
          </div>
        ) : allDrops.map(({item: d, status}, i) => {
          const idol = d.idol ? getIdol(d.idol) : null;
          return (
            <div key={i} className="card fade" style={{animationDelay:`${i*.04}s`,overflow:"hidden"}}>
              <ColorBar color={idol?.color ?? "#6b7280"}/>
              <div style={{padding:"13px 13px 11px",display:"flex",gap:11,alignItems:"flex-start"}}>
                <div style={{width:44,height:44,borderRadius:12,background:`${idol?.color ?? "#6b7280"}16`,border:`1px solid ${idol?.color ?? "#6b7280"}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                  {status.days === 0 ? "🔴" : status.upcoming ? "📅" : "🎵"}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                    <span style={{fontSize:13,fontWeight:700}}>{d.title}</span>
                    {!status.upcoming && status.label === "New" && <span style={{fontSize:9,padding:"2px 8px",borderRadius:18,background:"rgba(239,68,68,.18)",color:"#ef4444",fontFamily:"'Space Mono'",fontWeight:700}}>NEW</span>}
                  </div>
                  <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)",marginBottom:8}}>{d.artist} · {d.type} · {d.date}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                    {d.ytUrl && <a href={d.ytUrl} target="_blank" rel="noopener noreferrer"><button className="tap pill" style={{background:"rgba(239,68,68,.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,.2)",fontSize:10}}>▶ YouTube</button></a>}
                    <span style={{fontSize:10,padding:"3px 10px",borderRadius:18,background:status.upcoming ? "rgba(255,255,255,.05)" : `${idol?.color ?? "#6b7280"}12`,color:status.upcoming ? "rgba(255,255,255,.45)" : idol?.color ?? "rgba(255,255,255,.4)",fontFamily:"'Space Mono'"}}>{status.label}</span>
                    {idol && <IdolTag idol={idol}/>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
