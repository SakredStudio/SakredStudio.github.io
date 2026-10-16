import { useRef } from "react";
import { MERCH_SHOPS } from "../data/merch";
import { GLOSSARY } from "../data/glossary";
import { BUDGET_TIPS } from "../data/tips";
import { APP_NAME, THEME } from "../theme";
import { getIdol } from "../lib/groups";
import { Lbl, Disclosure, Header } from "../components/ui";
import type { AppState } from "../state/useSwaiyu";

// Me = Fan Card, my groups, merch shops, budget tips, glossary (stacked), privacy.
// Step 4 of BUILD-PLAN-V2.md turns the Fan Card into a shareable image.
export function Me({app}: {app: AppState}) {
  return (
    <div style={{overflowY:"auto",paddingBottom:90}}>
      <Header kicker="Your fan identity" title="Me"/>
      <FanCard app={app}/>
      <MyGroups app={app}/>
      <Merch/>
      <Budget/>
      <Glossary app={app}/>
      <Disclosure/>
      <div style={{padding:"8px 20px 30px",textAlign:"center"}}>
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="sans" style={{display:"inline-block",padding:12,fontSize:13,color:"rgba(255,255,255,.6)",textDecoration:"underline"}}>Privacy Policy</a>
        <div className="sans" style={{fontSize:13,color:"rgba(255,255,255,.6)",marginTop:6}}>{APP_NAME} · Sakred Studio</div>
      </div>
    </div>
  );
}

const Section = ({title, children}: {title: string; children: React.ReactNode}) =>
  <div style={{padding:"0 20px 22px"}}>
    <Lbl style={{marginBottom:10}}>{title}</Lbl>
    {children}
  </div>;

function FanCard({app}: {app: AppState}) {
  const { myIdolData, setShowPicker, fanName, setFanName, fanBias, setFanBias, fanSince, setFanSince, fanPhoto, setFanPhoto, pushToast, anchor, heroGradient } = app;
  const fileRef = useRef<HTMLInputElement>(null);
  const biasData = getIdol(fanBias);

  const shareFanCard = async () => {
    const fandoms = myIdolData.map(i => i.fandom).join(", ");
    const text = `🎶 ${APP_NAME} Fan Card\n\n${fanName || "A K-pop fan"}\n${biasData ? `Ultimate bias: ${biasData.emoji} ${biasData.name}` : ""}\nFandoms: ${fandoms}\nStan since: ${fanSince}\n\nGet ${APP_NAME}: https://sakredstudio.github.io`;
    try {
      if (navigator.share) {
        await navigator.share({title: `My ${APP_NAME} Fan Card`, text});
      } else {
        await navigator.clipboard.writeText(text);
        pushToast("Fan Card copied to clipboard! 💜");
      }
    } catch {
      pushToast("Fan Card copied to clipboard! 💜");
    }
  };

  return (
    <Section title="🪪 Fan Card">
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setFanPhoto(ev.target?.result as string);
        reader.readAsDataURL(file);
      }}/>

      <div className="fc-card" style={{background:`linear-gradient(135deg,${anchor}cc,#1a0a2e 60%,#0c0020)`,marginBottom:16,minHeight:220}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 80% 20%,rgba(255,255,255,.05),transparent 60%)",pointerEvents:"none"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,position:"relative"}}>
          <div>
            <div style={{fontSize:12,opacity:.75,marginBottom:4}}>{APP_NAME}</div>
            <div className="h1" style={{fontSize:28,lineHeight:1.1}}>{fanName || "Your Name"}</div>
          </div>
          <div className="tap" onClick={() => fileRef.current?.click()} style={{width:56,height:56,borderRadius:16,background:"rgba(255,255,255,.12)",border:"1.5px dashed rgba(255,255,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,cursor:"pointer"}}>
            {fanPhoto ? <img src={fanPhoto} alt="fan" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:22}}>📸</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,position:"relative"}}>
          {myIdolData.map(idol => (
            <span key={idol.id} style={{fontSize:12,padding:"3px 9px",borderRadius:20,background:"rgba(255,255,255,.12)",fontWeight:700}}>{idol.emoji} {idol.fandom}</span>
          ))}
        </div>
        <div style={{display:"flex",gap:16,position:"relative"}}>
          <div>
            <div style={{fontSize:12,opacity:.7,marginBottom:2}}>Ultimate Bias</div>
            <div style={{fontSize:13,fontWeight:700}}>{biasData?.emoji} {biasData?.name}</div>
          </div>
          <div>
            <div style={{fontSize:12,opacity:.7,marginBottom:2}}>Stan Since</div>
            <div style={{fontSize:13,fontWeight:700}}>{fanSince}</div>
          </div>
        </div>
      </div>

      <Lbl style={{marginBottom:8}}>Your fan name</Lbl>
      <div style={{borderRadius:12,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",padding:"13px 14px",marginBottom:12}}>
        <input value={fanName} onChange={e => setFanName(e.target.value)} placeholder="e.g. PurpleWave / BTS_Joonie" maxLength={28} style={{width:"100%",background:"none",border:"none",color:THEME.text,fontSize:14,outline:"none"}}/>
      </div>

      <Lbl style={{marginBottom:8}}>Ultimate bias group</Lbl>
      <div className="hrow" style={{marginBottom:14,flexWrap:"wrap"}}>
        {myIdolData.map(idol => (
          <button key={idol.id} className="tap pill" onClick={() => setFanBias(idol.id)} style={{flexShrink:0,background:fanBias === idol.id ? `${idol.color}20` : "rgba(255,255,255,.04)",color:fanBias === idol.id ? idol.color : "rgba(255,255,255,.6)",border:`1px solid ${fanBias === idol.id ? idol.color+"44" : "rgba(255,255,255,.07)"}`}}>
            {idol.emoji} {idol.name}
          </button>
        ))}
        <button className="tap pill" onClick={() => setShowPicker(true)} style={{flexShrink:0,background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.6)",border:"1px solid rgba(255,255,255,.07)"}}>+ Groups</button>
      </div>

      <Lbl style={{marginBottom:8}}>Stan since</Lbl>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {["2019","2020","2021","2022","2023","2024","2025","2026"].map(yr => (
          <button key={yr} className="tap pill" onClick={() => setFanSince(yr)} style={{background:fanSince === yr ? "rgba(192,132,252,.2)" : "rgba(255,255,255,.04)",color:fanSince === yr ? "#c084fc" : "rgba(255,255,255,.6)",border:`1px solid ${fanSince === yr ? "rgba(192,132,252,.4)" : "rgba(255,255,255,.07)"}`}}>{yr}</button>
        ))}
      </div>

      <div style={{display:"flex",gap:9}}>
        <button className="tap" onClick={shareFanCard} style={{flex:1,padding:"14px",borderRadius:14,border:"none",background:heroGradient,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
          💜 Share Fan Card
        </button>
        <button className="tap" onClick={() => fileRef.current?.click()} style={{padding:"14px 16px",borderRadius:14,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.6)",fontSize:14,cursor:"pointer"}}>
          📸
        </button>
      </div>
    </Section>
  );
}

function MyGroups({app}: {app: AppState}) {
  const { myIdolData, toggleIdol, setShowPicker, pushToast, heroGradient } = app;
  return (
    <Section title={`⚙️ My Groups (${myIdolData.length})`}>
      <div className="sans" style={{fontSize:13,color:"rgba(255,255,255,.6)",lineHeight:1.7,marginBottom:12}}>Your feed, drops and fanchants are based on the groups you follow. Browse 100+ groups or add your own.</div>
      <button className="tap" onClick={() => setShowPicker(true)} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:heroGradient,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:14}}>
        🔍 Browse & Add Groups
      </button>
      {myIdolData.length > 0 ? (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {myIdolData.map(idol => (
            <div key={idol.id} className="tap" onClick={() => { toggleIdol(idol.id); pushToast(`Removed ${idol.name}`); }}
              style={{borderRadius:16,border:`1.5px solid ${idol.color}55`,background:`${idol.color}12`,padding:"14px 13px",transition:"all .2s",position:"relative"}}>
              <div style={{position:"absolute",top:10,right:11,fontSize:14,color:"rgba(255,255,255,.6)"}}>×</div>
              <div style={{fontSize:24,marginBottom:6}}>{idol.emoji}</div>
              <div style={{fontSize:13,fontWeight:700,marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{idol.name}</div>
              <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.6)",marginBottom:6}}>{idol.fandom}</div>
              <div style={{width:"100%",height:2,borderRadius:1,background:idol.color}}/>
            </div>
          ))}
        </div>
      ) : (
        <div className="sans" style={{textAlign:"center",padding:"20px 0",fontSize:13,color:"rgba(255,255,255,.6)"}}>No groups yet — tap "Browse & Add Groups" to start.</div>
      )}
    </Section>
  );
}

function Merch() {
  return (
    <Section title="🛍 Merch Shops">
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {MERCH_SHOPS.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer">
            <div className="card tap fade" style={{animationDelay:`${i*.04}s`,padding:"14px 15px"}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:44,height:44,borderRadius:12,background:`${s.color}18`,border:`1px solid ${s.color}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🛍</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                    <span style={{fontSize:16,fontWeight:700}}>{s.name}</span>
                    <span style={{fontSize:12,padding:"2px 8px",borderRadius:18,background:`${s.color}18`,color:s.color,fontWeight:700}}>{s.tag}</span>
                  </div>
                  <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.6)",lineHeight:1.55,marginBottom:5}}>{s.desc}</div>
                  <div style={{fontSize:12,color:"#22c55e"}}>{s.price}</div>
                </div>
                <div style={{fontSize:16,color:"rgba(255,255,255,.6)"}}>↗</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}

function Budget() {
  return (
    <Section title="💰 Budget Tips">
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{padding:"10px 14px",borderRadius:14,background:"rgba(34,197,94,.07)",border:"1px solid rgba(34,197,94,.18)"}}>
          <div className="sans" style={{fontSize:13,color:"rgba(255,255,255,.6)",lineHeight:1.65}}>💚 K-pop is expensive. Concerts, lightsticks, albums, photocards — it adds up fast. These tips from real fan communities help you take part without breaking the bank.</div>
        </div>
        {BUDGET_TIPS.map((t, i) => (
          <div key={i} className="card fade" style={{animationDelay:`${i*.04}s`,padding:"14px 15px"}}>
            <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
              <div style={{width:40,height:40,borderRadius:11,background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{t.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:700,marginBottom:3}}>{t.tip}</div>
                <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.6)",lineHeight:1.55,marginBottom:7}}>{t.detail}</div>
                <div style={{fontSize:12,padding:"3px 10px",borderRadius:18,display:"inline-block",background:"rgba(34,197,94,.1)",color:"#22c55e"}}>{t.save}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Glossary({app}: {app: AppState}) {
  const { glossSearch, setGlossSearch } = app;
  const q = glossSearch.toLowerCase();
  const hits = GLOSSARY.filter(g => !q || g.t.toLowerCase().includes(q) || g.d.toLowerCase().includes(q));
  return (
    <Section title="📖 K-Pop Glossary">
      <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:14,padding:"13px 14px",display:"flex",gap:9,alignItems:"center",marginBottom:14}}>
        <span style={{opacity:.4,fontSize:14}}>🔍</span>
        <input value={glossSearch} onChange={e => setGlossSearch(e.target.value)} placeholder="Search K-pop terms…" style={{background:"none",border:"none",color:THEME.text,fontSize:14,flex:1,outline:"none"}}/>
      </div>
      {hits.map((g, i) => (
        <div key={i} style={{padding:"11px 14px",borderRadius:13,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",marginBottom:7}}>
          <div style={{fontSize:14,fontWeight:700,color:"#c084fc",marginBottom:3}}>{g.t}</div>
          <div className="sans" style={{fontSize:13,color:"rgba(255,255,255,.6)",lineHeight:1.55}}>{g.d}</div>
        </div>
      ))}
      {hits.length === 0 && (
        <div style={{textAlign:"center",padding:"32px 0",color:"rgba(255,255,255,.6)"}}>
          <div style={{fontSize:36,marginBottom:8}}>🔍</div>
          <div className="sans">No terms found</div>
        </div>
      )}
    </Section>
  );
}
