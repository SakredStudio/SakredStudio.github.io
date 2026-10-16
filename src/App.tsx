import { THEME, buildCss } from "./theme";
import { useSwaiyu } from "./state/useSwaiyu";
import { Nav } from "./components/Nav";
import { Picker } from "./components/Picker";
import { Onboard } from "./screens/Onboard";
import { Home } from "./screens/Home";
import { Concerts } from "./screens/Concerts";
import { Fani } from "./screens/Fani";
import { Me } from "./screens/Me";

/* ═══════════════════════════════════════════════════════
   SWAIYU v2 — 4-tab shell. State lives in state/useSwaiyu.ts,
   data in data/*, helpers in lib/*, screens in screens/*.
═══════════════════════════════════════════════════════ */
export default function App() {
  const app = useSwaiyu();
  const { tab, setTab, toasts, showOnboard, anchor, heroGradient } = app;

  if (showOnboard) return <Onboard app={app}/>;

  return (
    <div style={{fontFamily:"'DM Sans'",background:THEME.bg,minHeight:"100vh",color:THEME.text,display:"flex",justifyContent:"center"}}>
      <style>{buildCss(anchor, heroGradient)}</style>

      <div className="toast-wrap">
        {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>

      <Picker app={app}/>

      <div style={{width:"100%",maxWidth:430,minHeight:"100vh",display:"flex",flexDirection:"column",position:"relative"}}>
        {/* Shared anchor-tinted backdrop behind ALL views (driven by bias-group color) */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:240,background:`radial-gradient(ellipse at 70% -10%,${anchor}18 0%,transparent 70%)`,pointerEvents:"none",zIndex:0}}/>
        <div style={{flex:1,overflow:"hidden",position:"relative",zIndex:1}}>
          {tab === "home"     && <Home app={app}/>}
          {tab === "concerts" && <Concerts app={app}/>}
          {tab === "fani"     && <Fani app={app}/>}
          {tab === "me"       && <Me app={app}/>}
        </div>
        <Nav tab={tab} setTab={setTab} anchor={anchor}/>
      </div>
    </div>
  );
}
