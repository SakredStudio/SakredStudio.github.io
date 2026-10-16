import { getIdol } from "../lib/groups";
import type { Idol } from "../data/idols";
import { APP_NAME } from "../theme";

export const Lbl = ({children, style}: {children: React.ReactNode; style?: React.CSSProperties}) =>
  <div className="lbl" style={style}>{children}</div>;

export const IdolTag = ({idol, size = 12}: {idol: string | Idol; size?: number}) => {
  const d: Idol | undefined = typeof idol === "string" ? getIdol(idol) : idol;
  if (!d) return null;
  return (
    <span style={{fontSize:size,padding:"2px 8px",borderRadius:14,background:`${d.color}22`,color:d.color,fontWeight:700}}>
      {d.emoji} {d.name}
    </span>
  );
};

export const ColorBar = ({color}: {color: string}) =>
  <div style={{height:2.5,background:`linear-gradient(90deg,${color},${color}44)`}}/>;

// The single affiliate disclosure a screen shows (ROADMAP.md §1 rule 4). Replaces the
// per-link affiliate badges from v1.
export const Disclosure = () =>
  <div className="sans" style={{fontSize:13,color:"rgba(255,255,255,.6)",textAlign:"center",padding:"8px 20px 4px",lineHeight:1.5}}>
    Some links are affiliate links. {APP_NAME} may earn a commission at no extra cost to you.
  </div>;

// Screen header used by every tab.
export const Header = ({kicker, title, sub}: {kicker: string; title: React.ReactNode; sub?: string}) =>
  <div style={{padding:"52px 22px 16px"}}>
    <Lbl>{kicker}</Lbl>
    <div className="h1" style={{fontSize:28,marginBottom:sub ? 4 : 0}}>{title}</div>
    {sub && <div className="sans" style={{fontSize:13,color:"rgba(255,255,255,.6)",lineHeight:1.6}}>{sub}</div>}
  </div>;
