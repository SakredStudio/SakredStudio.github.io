import { CONCERT_KIT } from "../data/kit";
import { CHANT_LIBRARY } from "../data/chants";
import { THEME, inputStyle, ink } from "../theme";
import { getIdol, FULL_CATALOG } from "../lib/groups";
import { getDays } from "../lib/drops";
import { concertSearchUrl, buildTicketSearchUrl, isHttpUrl } from "../lib/affiliate";
import { Lbl, IdolTag, ColorBar, Disclosure, Header } from "../components/ui";
import type { AppState } from "../state/useSwaiyu";

// Concerts = live ticket links per group + save-my-show + prep checklist + fanchants.
// (v1's Events tab plus the Fan Hub › Fanchants section.)
export function Concerts({app}: {app: AppState}) {
  const { myIdols, myIdolData, savedEvent, setShowPicker, buyGradient,
          saveIdol, setSaveIdol, saveDate, setSaveDate, saveCity, setSaveCity, saveVenue, setSaveVenue,
          saveConcert, clearSavedConcert, checkedItems, toggleCheck, completedChecks, totalChecks } = app;
  const event = savedEvent;
  const days = event ? getDays(event.date) : null;
  const idol = event ? getIdol(event.idol) : null;
  const eventWhere = event ? [event.venue, event.city].filter(Boolean).join(" · ") : "";

  return (
    <div style={{overflowY:"auto",paddingBottom:90}}>
      <Header kicker="Live Tickets + Full Kit" title={<>Concert<br/>Planner</>} sub="Tap a group for live Ticketmaster dates, save your show, then work the prep checklist."/>

      {/* ── LIVE GROUP GRID → Ticketmaster (never stored, never stale) ── */}
      <div style={{padding:"0 20px 8px",display:"flex",alignItems:"center",gap:8}}>
        <div style={{fontSize:13,fontWeight:700}}>🎤 Your Groups · Live Dates</div>
      </div>
      {myIdolData.length === 0 ? (
        <div style={{margin:"0 20px 18px",borderRadius:18,background:"var(--surface)",border:"1px solid var(--border)",padding:"26px 18px",textAlign:"center"}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>Follow a group to see live shows 🎤</div>
          <div className="sans" style={{fontSize:12,color:"var(--t2)",marginBottom:14,lineHeight:1.5}}>Pick your groups and we'll deep-link straight into their current Ticketmaster dates.</div>
          <button className="tap mono" onClick={() => setShowPicker(true)} style={{padding:"12px 16px",borderRadius:20,border:`1px solid ${THEME.primary}88`,background:THEME.primary+"22",color:"#C9A9FF",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Follow groups</button>
        </div>
      ) : (
        <div style={{padding:"0 20px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {myIdolData.map(g => {
            const tmUrl = concertSearchUrl(g.name);
            const resaleUrl = buildTicketSearchUrl("stubhub", g.name);
            return (
              <div key={g.id} style={{borderRadius:18,background:`${g.color}14`,border:`1px solid ${g.color}28`,padding:"14px 13px",display:"flex",flexDirection:"column",gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                  <div style={{width:38,height:38,borderRadius:12,background:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{g.emoji}</div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.name}</div>
                    <div className="sans" style={{fontSize:12,color:"var(--t2)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.fandom}</div>
                  </div>
                </div>
                <a href={tmUrl} target="_blank" rel="noopener noreferrer">
                  <button className="tap" style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:buyGradient,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:`0 5px 16px ${THEME.accent}44`}}>Find tickets ↗</button>
                </a>
                {isHttpUrl(resaleUrl) && (
                  <a href={resaleUrl} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:44,padding:"8px 0"}}>
                    <span className="mono" style={{fontSize:13,fontWeight:700,color:ink(g.color)}}>Check resale ↗</span>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── SAVE MY CONCERT → self-contained {idol,date,city?,venue?} ── */}
      <div style={{padding:"0 20px 18px"}}>
        <div style={{borderRadius:18,background:"var(--surface)",border:"1px solid var(--border)",padding:"14px 15px"}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>💾 Save My Concert</div>
          {myIdolData.length === 0 ? (
            <div className="sans" style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>Follow a group above first, then save your show date here to unlock the Home countdown.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <select value={saveIdol || myIdols[0] || ""} onChange={e => setSaveIdol(e.target.value)} style={inputStyle}>
                {myIdolData.map(g => <option key={g.id} value={g.id} style={{color:"#000"}}>{g.emoji} {g.name}</option>)}
              </select>
              <input type="date" value={saveDate} onChange={e => setSaveDate(e.target.value)} style={inputStyle}/>
              <div style={{display:"flex",gap:8}}>
                <input type="text" placeholder="City (optional)" value={saveCity} onChange={e => setSaveCity(e.target.value)} style={inputStyle}/>
                <input type="text" placeholder="Venue (optional)" value={saveVenue} onChange={e => setSaveVenue(e.target.value)} style={inputStyle}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="tap" onClick={saveConcert} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:buyGradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save concert</button>
                {event && <button className="tap" onClick={clearSavedConcert} style={{padding:"12px 16px",borderRadius:12,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--t2)",fontSize:12,cursor:"pointer"}}>Clear</button>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CONCERT KIT — always rendered & standalone (no saved concert required) ── */}
      <div className="fade" style={{padding:"0 20px 20px"}}>
        <div style={{borderRadius:22,background:`linear-gradient(135deg,${idol?.color ?? "#7c3aed"}10,rgba(255,255,255,.02))`,border:`1px solid ${idol?.color ?? "#7c3aed"}28`,overflow:"hidden",marginBottom:14}}>
          <div style={{padding:"16px 16px 12px",borderBottom:"1px solid var(--divider)"}}>
            <Lbl style={{color:idol?.color}}>🎟 Concert Kit</Lbl>
            <div style={{fontSize:15,fontWeight:700}}>{event ? `${Math.max(days ?? 0, 0)} days · ${idol?.name ?? "Your show"}${eventWhere ? " · " + eventWhere : ""}` : "Your prep checklist"}</div>
          </div>

          <div style={{padding:"13px 16px",borderBottom:"1px solid var(--divider)"}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>🌐 Official Merch</div>
            <div style={{display:"flex",gap:7}}>
              {["Weverse","Ktown4u"].map(shop => (
                <a key={shop} href={shop === "Weverse" ? "https://weverse.io" : "https://ktown4u.com"} target="_blank" rel="noopener noreferrer" style={{flex:1}}>
                  <button className="tap" style={{width:"100%",padding:"12px",borderRadius:12,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--t2)",fontSize:12,cursor:"pointer"}}>{shop} ↗</button>
                </a>
              ))}
            </div>
          </div>

          <div style={{padding:"13px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:13,fontWeight:700}}>📋 Prep Checklist</div>
              <div style={{fontSize:12,color:ink(idol?.color ?? "#7c3aed")}}>{completedChecks}/{totalChecks} done</div>
            </div>
            <div className="progress" style={{marginBottom:10}}>
              <div className="progress-fill" style={{width:`${totalChecks > 0 ? (completedChecks/totalChecks)*100 : 0}%`,background:`linear-gradient(90deg,${idol?.color ?? "#7c3aed"},#f472b6)`}}/>
            </div>
            {CONCERT_KIT.map((phase, pi) => (
              <div key={pi} style={{marginBottom:12}}>
                <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:14}}>{phase.icon}</span>
                  <div style={{fontSize:12,fontWeight:700,color:ink(phase.color)}}>{phase.phase}</div>
                </div>
                {phase.items.map((item, ii) => {
                  const key = `${pi}-${ii}`, done = checkedItems[key];
                  return (
                    <div key={ii} className="tap" onClick={() => toggleCheck(key)} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 0",minHeight:44,borderBottom:"1px solid var(--divider)",cursor:"pointer"}}>
                      <div className="check-box" style={{borderColor:done ? phase.color : "var(--border)",background:done ? `${phase.color}20` : "transparent"}}>
                        {done && <span style={{fontSize:12,color:phase.color}}>✓</span>}
                      </div>
                      <div style={{flex:1}}>
                        <div className="sans" style={{fontSize:13,color:done ? "var(--t3)" : "var(--t1)",textDecoration:done ? "line-through" : "none",lineHeight:1.4}}>{item.t}</div>
                        {item.aff && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{display:"inline-flex"}}>
                            <div style={{marginTop:4,display:"inline-flex",gap:4,alignItems:"center",minHeight:44,padding:"10px 0",fontSize:13,fontWeight:700,color:ink(phase.color)}}>{item.tag} ↗</div>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Fanchants app={app}/>
      <Disclosure/>
    </div>
  );
}

// ── FANCHANTS (saved set + generate + custom + library) ─────────────────────
function Fanchants({app}: {app: AppState}) {
  const { myIdols, myChants, openChant, setOpenChant, showAllChants, setShowAllChants,
          chantLibGroup, setChantLibGroup, chantFormGroup, setChantFormGroup, chantFormSong, setChantFormSong,
          chantFormText, setChantFormText, chantFormYt, setChantFormYt, chantGenGroup, setChantGenGroup,
          chantGenSong, setChantGenSong, chantMode, isChantSaved, toggleLibraryChant, addCustomChant, removeChant, generateChant,
          heroGradient, buyGradient } = app;
  const visibleChants = showAllChants ? myChants : myChants.slice(0, 4);
  const libGroups = Array.from(new Set(CHANT_LIBRARY.map(c => c.idol).filter((x): x is string => !!x)));
  const libFiltered = chantLibGroup === "all" ? CHANT_LIBRARY : CHANT_LIBRARY.filter(c => c.idol === chantLibGroup);

  return (
    <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:16,paddingBottom:12}}>
      <div style={{paddingTop:6}}>
        <Lbl>🎤 Fanchants</Lbl>
        <div className="h1" style={{fontSize:22}}>Learn before the show</div>
      </div>
      <div style={{padding:"10px 14px",borderRadius:14,background:"rgba(124,58,237,.07)",border:"1px solid rgba(124,58,237,.18)"}}>
        <div className="sans" style={{fontSize:13,color:"var(--t2)",lineHeight:1.65}}>💡 <strong style={{color:"var(--t1)"}}>What is a fanchant?</strong> Scripted fan cheers tied to specific song moments. The whole crowd chants together — one of the most electric parts of any K-pop concert.</div>
      </div>

      {/* ── MY CHANTS (first 4 + show-all expand) ── */}
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <Lbl style={{marginBottom:0}}>🎤 My Chants ({myChants.length})</Lbl>
          {myChants.length > 4 && (
            <button className="tap mono" onClick={() => setShowAllChants(v => !v)} style={{padding:"10px 14px",borderRadius:18,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--t2)",fontSize:12,fontWeight:700,cursor:"pointer"}}>{showAllChants ? "Show less" : `Show all (${myChants.length})`}</button>
          )}
        </div>
        {myChants.length === 0 ? (
          <div style={{borderRadius:16,background:"var(--surface)",border:"1px solid var(--border)",padding:"22px 16px",textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:5}}>No saved chants yet 🎤</div>
            <div className="sans" style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>Add one from the library below, write your own, or generate one with FANI.</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {visibleChants.map(fc => {
              const idol = fc.idol ? getIdol(fc.idol) : null;
              const color = idol?.color ?? "#7c3aed";
              const open = openChant === fc.id;
              return (
                <div key={fc.id} className="card" style={{overflow:"hidden"}}>
                  <ColorBar color={color}/>
                  <div className="tap" onClick={() => setOpenChant(open ? null : fc.id)} style={{padding:"13px 13px 11px",display:"flex",gap:11,alignItems:"center"}}>
                    <div style={{width:46,height:46,borderRadius:13,background:`${color}18`,border:`1px solid ${color}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{idol?.emoji ?? "🎤"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:16,fontWeight:700,marginBottom:2,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                        <span>{fc.song}</span>
                        {fc.aiGenerated && <span style={{fontSize:12,padding:"2px 7px",borderRadius:18,background:"rgba(251,191,36,.16)",color:"#fbbf24",fontWeight:700}}>AI</span>}
                      </div>
                      {fc.idol ? <IdolTag idol={fc.idol}/> : <span className="sans" style={{fontSize:12,color:"var(--t2)"}}>{fc.artist}</span>}
                    </div>
                    <div style={{fontSize:19,color:"var(--t2)",transition:"transform .3s",transform:open ? "rotate(90deg)" : "none"}}>›</div>
                  </div>
                  {open && (
                    <div className="fade" style={{padding:"0 13px 14px",borderTop:"1px solid var(--divider)"}}>
                      {fc.aiGenerated && <div className="sans" style={{marginTop:10,marginBottom:10,fontSize:12,color:"#fbbf24",background:"rgba(251,191,36,.08)",border:"1px solid rgba(251,191,36,.2)",borderRadius:10,padding:"7px 10px",lineHeight:1.5}}>⚠️ AI-generated — verify before the show.</div>}
                      {fc.guide && <div className="sans" style={{fontSize:13,color:"var(--t2)",lineHeight:1.65,marginBottom:12,marginTop:fc.aiGenerated ? 0 : 10}}>{fc.guide}</div>}
                      {fc.lines && fc.lines.length > 0 && (
                        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
                          {fc.lines.map((l, li) => (
                            <div key={li} style={{borderRadius:12,background:"var(--surface)",border:"1px solid var(--border)",padding:"10px 12px"}}>
                              <div className="sans" style={{fontSize:12,color:"var(--t2)",marginBottom:4,fontStyle:"italic"}}>"{l.lyric}"</div>
                              <div style={{fontSize:13,fontWeight:700,color:ink(color),marginBottom:3}}>{l.chant}</div>
                              <div className="sans" style={{fontSize:12,color:"var(--t2)"}}>{l.note}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {fc.text && <div className="sans" style={{fontSize:13,color:"var(--t2)",lineHeight:1.7,marginBottom:12,marginTop:(!fc.guide && !fc.aiGenerated) ? 10 : 0,whiteSpace:"pre-wrap"}}>{fc.text}</div>}
                      {fc.ytUrl && (
                        <a href={fc.ytUrl} target="_blank" rel="noopener noreferrer">
                          <button className="tap" style={{width:"100%",padding:"12px",borderRadius:12,border:`1px solid ${color}28`,background:`${color}0e`,color:color,fontSize:12,cursor:"pointer",marginBottom:8}}>▶ Fanchant Video on YouTube</button>
                        </a>
                      )}
                      <button className="tap" onClick={() => removeChant(fc.id)} style={{width:"100%",padding:"12px",borderRadius:12,border:"1px solid rgba(239,68,68,.22)",background:"rgba(239,68,68,.08)",color:"var(--live)",fontSize:12,cursor:"pointer"}}>Remove from My Chants</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── GENERATE WITH FANI ── */}
      <div className="card" style={{padding:"14px 15px"}}>
        <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:700}}>✨ Generate with FANI</div>
          <div style={{display:"flex",gap:4,alignItems:"center"}}><div className="live-dot"/><span style={{fontSize:12,color:"var(--live)"}}>AI</span></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <select value={chantGenGroup || myIdols[0] || ""} onChange={e => setChantGenGroup(e.target.value)} style={inputStyle}>
            {FULL_CATALOG.map(g => <option key={g.id} value={g.id} style={{color:"#000"}}>{g.emoji} {g.name}</option>)}
          </select>
          <input type="text" placeholder="Song (optional)" value={chantGenSong} onChange={e => setChantGenSong(e.target.value)} style={inputStyle}/>
          <button className="tap" disabled={chantMode === "loading"} onClick={() => generateChant(chantGenGroup || myIdols[0] || "bts", chantGenSong)} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:chantMode === "loading" ? "var(--surface)" : heroGradient,color:"var(--t1)",fontSize:13,fontWeight:700,cursor:chantMode === "loading" ? "default" : "pointer",opacity:chantMode === "loading" ? .7 : 1}}>{chantMode === "loading" ? "Generating…" : "Generate chant"}</button>
          <div className="sans" style={{fontSize:12,color:"var(--t2)",textAlign:"center"}}>AI draft — always verify the chant before the show.</div>
        </div>
      </div>

      {/* ── ADD CUSTOM CHANT ── */}
      <div className="card" style={{padding:"14px 15px"}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>➕ Add Custom Chant</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <select value={chantFormGroup || myIdols[0] || ""} onChange={e => setChantFormGroup(e.target.value)} style={inputStyle}>
            {FULL_CATALOG.map(g => <option key={g.id} value={g.id} style={{color:"#000"}}>{g.emoji} {g.name}</option>)}
          </select>
          <input type="text" placeholder="Song title" value={chantFormSong} onChange={e => setChantFormSong(e.target.value)} style={inputStyle}/>
          <textarea placeholder="Chant / lyrics — one line per cue" value={chantFormText} onChange={e => setChantFormText(e.target.value)} rows={4} style={{...inputStyle,resize:"vertical",lineHeight:1.5}}/>
          <input type="text" placeholder="YouTube URL (optional)" value={chantFormYt} onChange={e => setChantFormYt(e.target.value)} style={inputStyle}/>
          <button className="tap" onClick={addCustomChant} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:buyGradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add chant</button>
        </div>
      </div>

      {/* ── CHANT LIBRARY (browse + add/remove) ── */}
      <div>
        <Lbl>📚 Chant Library</Lbl>
        <select value={chantLibGroup} onChange={e => setChantLibGroup(e.target.value)} style={{...inputStyle,marginBottom:10}}>
          <option value="all" style={{color:"#000"}}>All groups</option>
          {libGroups.map(gid => <option key={gid} value={gid} style={{color:"#000"}}>{getIdol(gid)?.emoji ?? "🎵"} {getIdol(gid)?.name ?? gid}</option>)}
        </select>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {libFiltered.map(c => {
            const idol = c.idol ? getIdol(c.idol) : null;
            const color = idol?.color ?? "#7c3aed";
            const saved = isChantSaved(c.id);
            return (
              <div key={c.id} style={{borderRadius:14,background:"var(--surface)",border:"1px solid var(--border)",padding:"11px 12px",display:"flex",gap:11,alignItems:"center"}}>
                <div style={{width:38,height:38,borderRadius:11,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{idol?.emoji ?? "🎵"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.song}</div>
                  <div className="sans" style={{fontSize:12,color:"var(--t2)"}}>{c.artist}</div>
                </div>
                <button className="tap mono" onClick={() => toggleLibraryChant(c)} style={{flexShrink:0,padding:"11px 16px",borderRadius:18,border:`1px solid ${saved ? "var(--border)" : color+"66"}`,background:saved ? "var(--surface)" : `${color}1e`,color:saved ? "var(--t2)" : "#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>{saved ? "✓ Added" : "+ Add"}</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
