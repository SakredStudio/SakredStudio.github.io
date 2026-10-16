import { IDOLS } from "../data/idols";
import { APP_NAME, buildCss } from "../theme";
import { Lbl } from "../components/ui";
import { KEYS, save } from "../lib/storage";
import type { AppState } from "../state/useSwaiyu";

export function Onboard({app}: {app: AppState}) {
  const { myIdols, toggleIdol, setShowOnboard, heroGradient, anchor, theme } = app;
  return (
    <div style={{background:"var(--bg)",minHeight:"100vh",color:"var(--t1)",display:"flex",justifyContent:"center"}}>
      <style>{buildCss(theme, anchor, heroGradient)}</style>
      <div style={{width:"100%",maxWidth:430,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"40px 24px 32px"}}>
          <div style={{textAlign:"center",marginBottom:36}}>
            <img src="./icon-512.png" alt={APP_NAME} width={56} height={56} style={{width:56,height:56,marginBottom:14,borderRadius:14,objectFit:"contain"}}/>
            {/* Gradient + clip on the SAME text node via backgroundImage (longhand) so the
                shorthand never resets background-clip; solid fallback color guarantees it
                can never render invisible. */}
            <div className="h1" style={{fontSize:42,marginBottom:8,display:"inline-block",backgroundImage:heroGradient,WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",color:"var(--accent)"}}>{APP_NAME}</div>
            <div className="sans" style={{fontSize:14,color:"var(--t2)",lineHeight:1.7}}>The fan app built for real K-pop fans.<br/>Pick your groups to get started.</div>
          </div>
          <Lbl>Who do you stan? (pick all that apply)</Lbl>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}}>
            {IDOLS.map(idol => {
              const sel = myIdols.includes(idol.id);
              return (
                <div key={idol.id} className="tap" onClick={() => toggleIdol(idol.id)}
                  style={{borderRadius:16,border:`1.5px solid ${sel ? idol.color+"66" : "var(--border)"}`,background:sel ? `${idol.color}14` : "var(--surface)",padding:"13px 14px",transition:"all .2s"}}>
                  <div style={{fontSize:22,marginBottom:5}}>{idol.emoji}</div>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:1}}>{idol.name}</div>
                  <div className="sans" style={{fontSize:12,color:"var(--t2)"}}>{idol.fandom}</div>
                  {sel && <div style={{marginTop:6,width:"100%",height:2,borderRadius:1,background:idol.color}}/>}
                </div>
              );
            })}
          </div>
          <button className="tap" onClick={() => { save(KEYS.idols, myIdols); setShowOnboard(false); }} disabled={myIdols.length === 0}
            style={{width:"100%",padding:"16px",borderRadius:16,border:"none",background:myIdols.length > 0 ? heroGradient : "var(--surface)",color:myIdols.length > 0 ? "#fff" : "var(--t2)",fontSize:14,fontWeight:700,cursor:myIdols.length > 0 ? "pointer" : "default"}}>
            Enter {APP_NAME} {myIdols.length > 0 ? `— ${myIdols.length} group${myIdols.length > 1 ? "s" : ""} selected` : ""}
          </button>
          <div className="sans" style={{textAlign:"center",marginTop:12,fontSize:12,color:"var(--t2)"}}>You can change your groups anytime in Me</div>
        </div>
      </div>
    </div>
  );
}
