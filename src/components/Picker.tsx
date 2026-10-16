import { FULL_CATALOG } from "../lib/groups";

import { Lbl } from "./ui";
import type { AppState } from "../state/useSwaiyu";

type GroupCardData = {id: string; name: string; emoji: string; color: string; fandom: string};

// Group picker (bottom sheet) — reachable from Home "+ Edit", Concerts and Me.
export function Picker({app}: {app: AppState}) {
  const { showPicker, setShowPicker, pickerSearch, setPickerSearch, customInput, setCustomInput,
          customGroups, myIdols, toggleIdol, pushToast, addCustomGroup, anchor, heroGradient } = app;
  if (!showPicker) return null;

  const groupCard = (g: GroupCardData) => {
    const sel = myIdols.includes(g.id);
    return (
      <div key={g.id} className="tap" onClick={() => { toggleIdol(g.id); pushToast(sel ? `Removed ${g.name}` : `Added ${g.name} 💜`); }}
        style={{borderRadius:14,border:`1.5px solid ${sel ? g.color+"66" : "var(--border)"}`,background:sel ? `${g.color}14` : "var(--surface)",padding:"11px 12px",transition:"all .18s",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20,flexShrink:0}}>{g.emoji}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.name}</div>
          <div className="sans" style={{fontSize:12,color:"var(--t2)"}}>{g.fandom}</div>
        </div>
        <div style={{width:18,height:18,borderRadius:6,border:`1.5px solid ${sel ? g.color : "var(--border-strong)"}`,background:sel ? g.color : "transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--bg)",flexShrink:0}}>{sel ? "✓" : ""}</div>
      </div>
    );
  };

  const s = pickerSearch.trim().toLowerCase();
  const customAsCards: GroupCardData[] = customGroups.map(c => ({id:c.id, name:c.name, emoji:c.emoji, color:c.color, fandom:c.fandom}));
  const matches = s
    ? [...FULL_CATALOG, ...customAsCards].filter(g => g.name.toLowerCase().includes(s) || g.fandom.toLowerCase().includes(s))
    : null;
  const popular = FULL_CATALOG.filter(g => g.tier === "featured" || g.tier === "popular");
  const more = FULL_CATALOG.filter(g => g.tier === "more");
  const close = () => { setShowPicker(false); setPickerSearch(""); };
  const grid = (items: GroupCardData[]) =>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:16}}>{items.map(groupCard)}</div>;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(10px)",zIndex:700,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={close}>
      <div className="fade" style={{width:"100%",maxWidth:430,background:"var(--sheet)",borderRadius:"22px 22px 0 0",border:"1px solid var(--border)",padding:"18px 18px 36px",maxHeight:"86vh",display:"flex",flexDirection:"column"}} onClick={e => e.stopPropagation()}>
        <div style={{width:36,height:4,borderRadius:2,background:"var(--surface2)",margin:"0 auto 16px",flexShrink:0}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexShrink:0}}>
          <div style={{fontSize:16,fontWeight:700}}>Your Groups <span style={{color:anchor}}>({myIdols.length})</span></div>
          <button className="tap" onClick={close} style={{background:"none",border:"none",color:"var(--t2)",fontSize:22,cursor:"pointer",padding:"8px 12px",minWidth:44,minHeight:44}}>×</button>
        </div>
        <div style={{borderRadius:12,background:"var(--surface)",border:"1px solid var(--border)",padding:"13px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
          <span style={{fontSize:14,opacity:.5}}>🔍</span>
          <input value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} placeholder="Search 100+ groups by name or fandom" style={{width:"100%",background:"none",border:"none",color:"var(--t1)",fontSize:14,outline:"none"}}/>
        </div>

        <div style={{overflowY:"auto",flex:1,minHeight:0}}>
          {matches ? (
            matches.length > 0 ? grid(matches) : (
              <div className="sans" style={{textAlign:"center",padding:"24px 0",fontSize:13,color:"var(--t2)"}}>No groups found for "{pickerSearch.trim()}" — add it as a custom group below ↓</div>
            )
          ) : (
            <>
              <Lbl style={{marginBottom:9}}>⭐ Popular</Lbl>
              {grid(popular)}
              {customAsCards.length > 0 && <><Lbl style={{marginBottom:9}}>🎤 Your Custom Groups</Lbl>{grid(customAsCards)}</>}
              <Lbl style={{marginBottom:9}}>More Groups</Lbl>
              {grid(more)}
            </>
          )}
        </div>

        <div style={{borderTop:"1px solid var(--divider)",paddingTop:14,marginTop:4,flexShrink:0}}>
          <Lbl style={{marginBottom:8}}>Can't find your group? Add it →</Lbl>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1,borderRadius:12,background:"var(--surface)",border:"1px solid var(--border)",padding:"10px 14px"}}>
              <input value={customInput} onChange={e => setCustomInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addCustomGroup(); }} maxLength={40} placeholder="e.g. your local group" style={{width:"100%",background:"none",border:"none",color:"var(--t1)",fontSize:14,outline:"none"}}/>
            </div>
            <button className="tap" onClick={addCustomGroup} disabled={!customInput.trim()} style={{padding:"0 18px",borderRadius:12,border:"none",background:customInput.trim() ? heroGradient : "var(--surface)",color:customInput.trim() ? "#fff" : "var(--t2)",fontSize:14,fontWeight:700,cursor:customInput.trim() ? "pointer" : "default"}}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
