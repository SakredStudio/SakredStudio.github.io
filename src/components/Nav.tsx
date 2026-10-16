import type { TabId } from "../state/useSwaiyu";

export const TABS: {id: TabId; icon: string; label: string}[] = [
  {id:"home",     icon:"⚡", label:"Home"},
  {id:"concerts", icon:"🎟", label:"Concerts"},
  {id:"fani",     icon:"🤖", label:"FANI"},
  {id:"me",       icon:"💜", label:"Me"},
];

export function Nav({tab, setTab, anchor}: {tab: TabId; setTab: (t: TabId) => void; anchor: string}) {
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(6,4,14,.97)",backdropFilter:"blur(28px)",borderTop:"1px solid rgba(255,255,255,.07)",padding:`8px 4px calc(16px + env(safe-area-inset-bottom, 8px))`,display:"flex",zIndex:300}}>
      {TABS.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} className="tap" onClick={() => setTab(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0"}}>
            <div style={{fontSize:active ? 22 : 19,transition:"all .2s",filter:active ? `drop-shadow(0 0 7px ${anchor})` : "none"}}>{t.icon}</div>
            <div style={{fontSize:11,fontWeight:700,color:active ? anchor : "rgba(255,255,255,.35)",fontFamily:"'DM Sans'",transition:"color .2s"}}>{t.label}</div>
            {active && <div style={{width:3,height:3,borderRadius:"50%",background:anchor,boxShadow:`0 0 6px ${anchor}`}}/>}
          </button>
        );
      })}
    </div>
  );
}
