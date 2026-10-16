import { useEffect, useRef } from "react";
import { THEME } from "../theme";
import { Lbl } from "../components/ui";
import type { AppState } from "../state/useSwaiyu";

// Quick prompts absorb v1's Glossary and Budget Tips entry points (ROADMAP.md §2.1).
const QUICK = [
  "What should I buy first as a new fan?",
  "How do I learn fanchants fast?",
  "What's a POB and why does it matter?",
  "Best budget way to collect photocards?",
  "How early should I arrive at a K-pop concert?",
  "Explain 'bias', 'bias wrecker' and 'OT7'",
];

export function Fani({app}: {app: AppState}) {
  const { aiMode, aiMessages, aiInput, setAiInput, sendAiMessage, heroGradient } = app;
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({behavior: "smooth"}); }, [aiMessages]);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 92px - env(safe-area-inset-bottom, 8px))"}}>
      <div style={{padding:"52px 22px 16px",borderBottom:"1px solid rgba(255,255,255,.06)",flexShrink:0}}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:46,height:46,borderRadius:14,background:heroGradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🤖</div>
          <div>
            <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:1}}>
              <div className="h1" style={{fontSize:18}}>FANI</div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}><div className="live-dot"/><span style={{fontSize:9,color:"#ef4444",fontFamily:"'Space Mono'"}}>AI LIVE</span></div>
            </div>
            <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)"}}>Powered by Claude · Ask anything K-pop</div>
          </div>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        {aiMessages.length === 0 && (
          <div className="fade">
            <div style={{textAlign:"center",padding:"20px 0 24px"}}>
              <div style={{fontSize:40,marginBottom:10}}>💜</div>
              <div style={{fontSize:14,fontWeight:700,marginBottom:5}}>Hi! I'm FANI</div>
              <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.38)",lineHeight:1.7}}>Your AI fan assistant. Ask me anything about K-pop — concerts, merch, music, culture, photocards, fan tips and more.</div>
            </div>
            <Lbl>Quick questions</Lbl>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {QUICK.map((q, i) => (
                <div key={i} className="tap card" onClick={() => sendAiMessage(q)} style={{padding:"11px 14px",cursor:"pointer",animationDelay:`${i*.05}s`}}>
                  <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.65)"}}>{q}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {aiMessages.map((msg, i) => (
          <div key={i} className="fade" style={{marginBottom:12,display:"flex",flexDirection:"column",alignItems:msg.role === "user" ? "flex-end" : "flex-start"}}>
            {msg.role === "assistant" && <div style={{fontSize:9,color:"rgba(255,255,255,.28)",fontFamily:"'Space Mono'",marginBottom:4}}>FANI 🤖</div>}
            <div style={{maxWidth:"85%",padding:"11px 14px",borderRadius:msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",background:msg.role === "user" ? heroGradient : "rgba(255,255,255,.07)",border:msg.role === "assistant" ? "1px solid rgba(255,255,255,.08)" : "none"}}>
              <div className="sans" style={{fontSize:13,lineHeight:1.65,color:"rgba(255,255,255,.9)",whiteSpace:"pre-wrap"}}>{msg.content}</div>
            </div>
          </div>
        ))}
        {aiMode === "loading" && (
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:12,background:heroGradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🤖</div>
            <div style={{display:"flex",gap:5}}>
              {[0,1,2].map(n => <div key={n} style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,.3)",animation:`pulse ${1+n*.2}s ease-in-out infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      <div style={{flexShrink:0,padding:"12px 16px 16px",borderTop:"1px solid rgba(255,255,255,.06)",background:"rgba(6,4,14,.97)",backdropFilter:"blur(20px)",position:"relative",zIndex:2}}>
        <div style={{display:"flex",gap:9,alignItems:"flex-end"}}>
          <div style={{flex:1,borderRadius:16,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",padding:"11px 14px"}}>
            <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }} placeholder="Ask FANI anything K-pop…" rows={1} style={{width:"100%",background:"none",border:"none",color:THEME.text,fontSize:13,resize:"none",outline:"none",lineHeight:1.5}}/>
          </div>
          <button className="tap" onClick={() => sendAiMessage()} disabled={!aiInput.trim() || aiMode === "loading"} style={{width:44,height:44,borderRadius:13,border:"none",background:aiInput.trim() && aiMode !== "loading" ? heroGradient : "rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",flexShrink:0}}>
            {aiMode === "loading" ? <div className="spin" style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%"}}/> : "↑"}
          </button>
        </div>
        <div className="sans" style={{marginTop:7,fontSize:10,color:"rgba(255,255,255,.45)",textAlign:"center"}}>FANI is an AI — always verify important info.</div>
      </div>
    </div>
  );
}
