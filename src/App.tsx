import { useEffect } from "react";
import { buildCss, tokensFor } from "./theme";
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
   Colors come from the active theme's CSS variables (theme.ts).
═══════════════════════════════════════════════════════ */
export default function App() {
  const app = useSwaiyu();
  const { tab, setTab, toasts, showOnboard, anchor, heroGradient, theme } = app;

  // Keep the Android status bar / TWA chrome in step with the theme.
  useEffect(() => {
    const bg = tokensFor(theme, anchor).bg;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
    document.documentElement.style.background = bg;
  }, [theme, anchor]);

  if (showOnboard) return <Onboard app={app}/>;

  return (
    <div style={{background:"var(--bg)",minHeight:"100vh",color:"var(--t1)",display:"flex",justifyContent:"center"}}>
      <style>{buildCss(theme, anchor, heroGradient)}</style>

      <div className="toast-wrap">
        {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>

      <Picker app={app}/>

      <div style={{width:"100%",maxWidth:430,minHeight:"100vh",display:"flex",flexDirection:"column",position:"relative"}}>
        {/* Shared anchor-tinted backdrop behind ALL views (driven by bias-group color) */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:240,background:`radial-gradient(ellipse at 70% -10%,${anchor}${theme === "bias" ? "40" : "18"} 0%,transparent 70%)`,pointerEvents:"none",zIndex:0}}/>
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
