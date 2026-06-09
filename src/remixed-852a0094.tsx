import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════════ */
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Space+Mono:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  html,body{height:100%;overscroll-behavior:none}
  ::-webkit-scrollbar{display:none}
  a{text-decoration:none;color:inherit}
  input,button,textarea{font-family:inherit}
  .tap{transition:transform .16s cubic-bezier(.22,1,.36,1),opacity .12s;cursor:pointer;user-select:none}
  .tap:active{transform:scale(.94);opacity:.75}
  .fade{animation:fu .38s cubic-bezier(.22,1,.36,1) both}
  @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .s1{animation-delay:.05s}.s2{animation-delay:.10s}.s3{animation-delay:.15s}
  .s4{animation-delay:.20s}.s5{animation-delay:.25s}.s6{animation-delay:.30s}
  .card{border-radius:20px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.09)}
  .pill{border-radius:50px;padding:6px 16px;font-size:11px;font-weight:700;border:none;cursor:pointer;white-space:nowrap;font-family:'Space Mono',monospace;transition:all .18s}
  .hrow{display:flex;gap:10px;overflow-x:auto;padding-bottom:2px}
  .spin{animation:sp .9s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
  .glow{box-shadow:0 0 22px rgba(var(--gc),0.38)}
  .h1{font-family:'Syne',sans-serif;font-weight:900;line-height:1.04;letter-spacing:-.025em}
  .mono{font-family:'Space Mono',monospace}
  .sans{font-family:'DM Sans',sans-serif}
  .lbl{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.28);font-family:'Space Mono',monospace;margin-bottom:7px}
  .badge{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:20px;font-size:9px;font-weight:700;font-family:'Space Mono'}
  .toast-wrap{position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:6px}
  .toast{background:rgba(12,6,28,.95);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.12);border-radius:30px;padding:9px 20px;font-size:12px;font-weight:600;white-space:nowrap;animation:fu .3s cubic-bezier(.22,1,.36,1)}
  .shimmer{background:linear-gradient(90deg,transparent,rgba(255,255,255,.04) 50%,transparent);background-size:200% 100%;animation:sh 2.2s infinite}
  @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .aff-tag{display:inline-flex;align-items:center;padding:1px 7px;border-radius:10px;background:rgba(251,191,36,.12);color:#fbbf24;font-size:9px;font-weight:700;font-family:'Space Mono';letter-spacing:.04em}
  .live-dot{width:7px;height:7px;border-radius:50%;background:#ef4444;animation:pulse 1.4s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
  .neon-border{border:1px solid;border-image:linear-gradient(135deg,var(--a1),var(--a2)) 1}
  .gradient-text{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .progress{height:3px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}
  .progress-fill{height:100%;border-radius:2px;transition:width .6s cubic-bezier(.22,1,.36,1)}
  .check-box{width:22px;height:22px;border-radius:7px;border:1.5px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;transition:all .2s}
`;

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */
const IDOLS = [
  {id:"bts",name:"BTS",emoji:"💜",color:"#7c3aed",era:"Grand Chapter",fandom:"ARMY",members:["Jin","Suga","J-Hope","RM","Jimin","V","Jungkook"],lightColor:"#7c3aed"},
  {id:"bp",name:"BLACKPINK",emoji:"🌸",color:"#ec4899",era:"BORN PINK",fandom:"BLINK",members:["Jisoo","Jennie","Rosé","Lisa"],lightColor:"#ec4899"},
  {id:"skz",name:"Stray Kids",emoji:"⚡",color:"#f97316",era:"DOMINATE",fandom:"STAY",members:["Chan","Lee Know","Changbin","Hyunjin","Han","Felix","Seungmin","I.N"],lightColor:"#f97316"},
  {id:"aespa",name:"aespa",emoji:"❄️",color:"#a78bfa",era:"Armageddon",fandom:"MY",members:["Karina","Giselle","Winter","NingNing"],lightColor:"#a78bfa"},
  {id:"svt",name:"SEVENTEEN",emoji:"💎",color:"#34d399",era:"SPILL THE FEELS",fandom:"CARAT",members:["S.Coups","Jeonghan","Joshua","Jun","Hoshi","Wonwoo","Woozi","DK","Mingyu","The8","Seungkwan","Vernon","Dino"],lightColor:"#34d399"},
  {id:"nj",name:"NewJeans",emoji:"🐰",color:"#60a5fa",era:"How Sweet",fandom:"Bunnies",members:["Minji","Hanni","Danielle","Haerin","Hyein"],lightColor:"#60a5fa"},
  {id:"ive",name:"IVE",emoji:"🌊",color:"#fb7185",era:"WAVE",fandom:"DIVE",members:["Gaeul","Yujin","Rei","Wonyoung","Liz","Leeseo"],lightColor:"#fb7185"},
  {id:"twice",name:"TWICE",emoji:"💋",color:"#f43f5e",era:"Ready to Be",fandom:"ONCE",members:["Nayeon","Jeongyeon","Momo","Sana","Jihyo","Mina","Dahyun","Chaeyoung","Tzuyu"],lightColor:"#f43f5e"},
];

const EVENTS = [
  {id:1,artist:"BTS",tour:"Grand Chapter World Tour",date:"2026-10-11",venue:"Rose Bowl, Pasadena",country:"🇺🇸",price:"From $198",idol:"bts",ticketUrl:"https://seatgeek.com"},
  {id:2,artist:"BLACKPINK",tour:"BORN PINK Encore",date:"2026-09-05",venue:"Madison Square Garden, NYC",country:"🇺🇸",price:"From $124",idol:"bp",ticketUrl:"https://ticketmaster.com"},
  {id:3,artist:"Stray Kids",tour:"DOMINATE World Tour",date:"2026-08-14",venue:"SoFi Stadium, LA",country:"🇺🇸",price:"From $89",idol:"skz",ticketUrl:"https://seatgeek.com"},
  {id:4,artist:"aespa",tour:"SYNK: PARALLEL LINE",date:"2026-07-19",venue:"The Forum, Inglewood",country:"🇺🇸",price:"From $75",idol:"aespa",ticketUrl:"https://ticketmaster.com"},
  {id:5,artist:"SEVENTEEN",tour:"RIGHT HERE World Tour",date:"2026-08-30",venue:"Allegiant Stadium, Las Vegas",country:"🇺🇸",price:"From $79",idol:"svt",ticketUrl:"https://seatgeek.com"},
  {id:6,artist:"NewJeans",tour:"BUNNIES CAMP 2026",date:"2026-11-01",venue:"United Center, Chicago",country:"🇺🇸",price:"From $88",idol:"nj",ticketUrl:"https://interpark.com"},
];

const DROPS = [
  {artist:"BLACKPINK",title:"PINK VENOM REBIRTH",type:"Single",date:"Apr 15",daysAgo:13,views:"48.2M",idol:"bp",ytUrl:"https://youtube.com/results?search_query=BLACKPINK+PINK+VENOM+REBIRTH"},
  {artist:"Stray Kids",title:"DOMINATE",type:"Album",date:"Apr 20",daysAgo:8,views:"31.7M",idol:"skz",ytUrl:"https://youtube.com/results?search_query=Stray+Kids+DOMINATE"},
  {artist:"aespa",title:"Supernova II",type:"MV",date:"Apr 22",daysAgo:6,views:"24.5M",idol:"aespa",ytUrl:"https://youtube.com/results?search_query=aespa+Supernova+II+MV"},
  {artist:"IVE",title:"WAVE",type:"Single",date:"Apr 25",daysAgo:3,views:"18.9M",idol:"ive",ytUrl:"https://youtube.com/results?search_query=IVE+WAVE+MV"},
  {artist:"KISS OF LIFE",title:"MIDAS TOUCH",type:"Album",date:"Apr 28",daysAgo:0,views:"NEW 🔴",idol:null,ytUrl:"https://youtube.com/results?search_query=KISS+OF+LIFE+MIDAS+TOUCH"},
  {artist:"NewJeans",title:"Supernatural Pt.2",type:"Single",date:"May 5",daysAgo:-7,views:"UPCOMING",idol:"nj",ytUrl:null},
  {artist:"TWS",title:"Golden Hour",type:"Mini Album",date:"May 12",daysAgo:-14,views:"UPCOMING",idol:null,ytUrl:null},
];

const FANCHANTS = [
  {song:"Dynamite",artist:"BTS",idol:"bts",guide:"During the chorus, fans shout member names in order: Jin · Suga · J-Hope · RM · Jimin · V · Jungkook on the 'da-da-da-da' break.",
    lines:[{lyric:"'Cause I, I, I'm in the stars tonight",chant:"[clap clap]",note:"Double clap on downbeat"},{lyric:"So watch me bring the fire and set the night alight",chant:"JIN! SUGA! J-HOPE! RM!",note:"One name per beat"},{lyric:"Shining through the city",chant:"JIMIN! V! JUNGKOOK!",note:"End strong"}],
    ytUrl:"https://youtube.com/results?search_query=BTS+Dynamite+fanchant+guide"},
  {song:"How You Like That",artist:"BLACKPINK",idol:"bp",guide:"Shout 'BLACKPINK!' before the first beat drops. During chorus, chant 'JISOO! JENNIE! ROSÉ! LISA!' in rapid succession.",
    lines:[{lyric:"Look at you, now look at me",chant:"BLACKPINK!",note:"Shout before the drop"},{lyric:"How you like that? How you like that?",chant:"JISOO! JENNIE!",note:"Sharp, punchy"},{lyric:"How you like that?",chant:"ROSÉ! LISA!",note:"Finish the quad"}],
    ytUrl:"https://youtube.com/results?search_query=BLACKPINK+How+You+Like+That+fanchant"},
  {song:"MIROH",artist:"Stray Kids",idol:"skz",guide:"Fast and intense. Shout all 8 members during the rap break. Crowd goes silent on the bridge for dramatic effect.",
    lines:[{lyric:"We go! Miroh!",chant:"[stomp stomp clap]",note:"Match the stomp"},{lyric:"[rap break]",chant:"CHAN! LEE KNOW! CHANGBIN! HYUNJIN!",note:"Loud and fast"},{lyric:"[continues]",chant:"HAN! FELIX! SEUNGMIN! I.N!",note:"Equal energy"}],
    ytUrl:"https://youtube.com/results?search_query=Stray+Kids+MIROH+fanchant"},
  {song:"FANCY",artist:"TWICE",idol:"twice",guide:"ONCE fans chant all 9 names. The chorus chant is iconic — practice it slowly first.",
    lines:[{lyric:"I just wanna make you fancy",chant:"NAYEON! JEONGYEON! MOMO!",note:"3 names, 3 beats"},{lyric:"Make you fancy me",chant:"SANA! JIHYO! MINA!",note:"Smooth and clear"},{lyric:"Fancy you, fancy you",chant:"DAHYUN! CHAEYOUNG! TZUYU!",note:"End triumphant"}],
    ytUrl:"https://youtube.com/results?search_query=TWICE+FANCY+fanchant"},
];

const CONCERT_KIT = [
  {phase:"30 Days Before",color:"#a78bfa",icon:"📅",items:[
    {t:"Secure your ticket",aff:true,url:"https://seatgeek.com",tag:"SeatGeek"},
    {t:"Order official lightstick (2-3 wk shipping from Korea)",aff:true,url:"https://weverse.io",tag:"Weverse"},
    {t:"Join official fan club for presale access next time"},
    {t:"Start planning your concert outfit"},
  ]},
  {phase:"14 Days Before",color:"#f97316",icon:"👗",items:[
    {t:"Order outfit pieces",aff:true,url:"https://yesstyle.com",tag:"YesStyle"},
    {t:"Learn fanchants for top 3 songs"},
    {t:"Download Weverse — artists post updates here"},
    {t:"Check venue bag policy (clear bags usually required)"},
  ]},
  {phase:"3 Days Before",color:"#22d3ee",icon:"✅",items:[
    {t:"Practise fanchants one final time"},
    {t:"Screenshot your ticket QR — no signal at venue"},
    {t:"Prepare fan banner or slogan if making one"},
    {t:"Check weather, plan layers"},
  ]},
  {phase:"Day Of Concert",color:"#22c55e",icon:"🎤",items:[
    {t:"Arrive 90 min early for lightstick Bluetooth sync"},
    {t:"Grab fan-made slogans outside venue (usually free!)"},
    {t:"Check Weverse for last-minute artist posts"},
    {t:"Charge phone to 100% — it's your backup lightstick"},
  ]},
];

const MERCH_SHOPS = [
  {name:"Weverse Shop",tag:"Official",desc:"Direct from labels. Albums, lightsticks, official photo books.",color:"#7c3aed",price:"$15–$120",url:"https://weverse.io"},
  {name:"YesStyle",tag:"Best Value",desc:"K-fashion + K-pop. Often cheaper than Weverse with fast global shipping.",color:"#22d3ee",price:"$12–$80",url:"https://yesstyle.com"},
  {name:"Ktown4u",tag:"Pre-Orders",desc:"Pre-orders with POB benefits, group orders, idol birthday events.",color:"#34d399",price:"$15–$60",url:"https://ktown4u.com"},
  {name:"Cokodive",tag:"Budget Pick",desc:"Frequent sales, bundle deals. Great for budget collectors.",color:"#f59e0b",price:"$10–$45",url:"https://cokodive.com"},
  {name:"Pocamarket",tag:"Photocards",desc:"Biggest photocard marketplace. Buyer protection, worldwide shipping.",color:"#f43f5e",price:"$2–$50+",url:"https://pocamarket.com"},
];

const GLOSSARY = [
  {t:"Bias",d:"Your absolute favourite member. Your #1."},
  {t:"Bias Wrecker",d:"A member who keeps threatening to become your new #1."},
  {t:"Comeback",d:"When a group releases new music after a break. Always a major event."},
  {t:"Fanchant",d:"Scripted crowd cheers tied to specific song moments. Fans chant in unison."},
  {t:"Stan",d:"An intensely dedicated fan. Also a verb: 'I stan BTS.'"},
  {t:"Multistan",d:"A fan who actively follows multiple groups at once."},
  {t:"OT (n)",d:"'One True (n) members.' e.g. 'OT7' = you stan all 7 BTS members equally."},
  {t:"POB",d:"Pre-Order Benefit. Exclusive extras (photocards, posters) for pre-orders only."},
  {t:"Lightstick",d:"Official fandom merch — Bluetooth glowing stick used at concerts. $50–$90."},
  {t:"MV",d:"Music Video. K-pop MVs are cinematic productions on YouTube."},
  {t:"Hiatus",d:"When an idol takes a break from activities, often for mandatory military service."},
  {t:"Weverse",d:"HYBE's fan platform. Artists post here directly. Essential app for fans."},
  {t:"Line Distribution",d:"How much each member sings in a song. Debated endlessly online."},
  {t:"Sasaeng",d:"Extreme invasive fan who violates idols' privacy. Universally condemned."},
  {t:"Daesang",d:"Korea's highest music award. Equivalent of Album/Artist of the Year."},
  {t:"Disbandment",d:"When a group officially ends. One of the most dreaded events in fandom."},
];

const BUDGET_TIPS = [
  {icon:"💿",tip:"Buy albums without photocards",detail:"Fans sell albums for $5–8 after keeping the PC. Search #albumsale on Instagram or Twitter/X.",save:"Save 60–80% vs retail"},
  {icon:"⏳",tip:"Wait 3–4 weeks after release",detail:"PC prices spike on release day then crash. A $40 card often becomes $12 within a month.",save:"Save 50–70% on PCs"},
  {icon:"👥",tip:"Join group orders (GOs)",detail:"Fan pools for international shipping. Find GOs on r/kpop, Twitter, or Discord fandom servers.",save:"Save $15–30 per order"},
  {icon:"📦",tip:"Pre-order for POB benefits",detail:"Pre-ordering unlocks exclusive photocards (POBs) that sell for 3–5x more later.",save:"Get $15–40 in free extras"},
  {icon:"💡",tip:"Lightstick alternatives",detail:"Phone flashlight works fine. Or buy the previous gen lightstick for 50% less on Mercari.",save:"Save $30–60"},
];

// ─── HELPERS ────────────────────────────────────────────────────────────────
const getDays = d => Math.ceil((new Date(d)-new Date())/86400000);
const getIdol = id => IDOLS.find(i=>i.id===id);

// ─── MINI COMPONENTS ────────────────────────────────────────────────────────
const Lbl = ({children,style}) => <div className="lbl" style={style}>{children}</div>;
const AffTag = () => <span className="aff-tag">AFFILIATE</span>;

const IdolTag = ({idol,size=10}) => {
  const d = typeof idol === "string" ? getIdol(idol) : idol;
  if(!d) return null;
  return <span style={{fontSize:size,padding:"2px 8px",borderRadius:14,background:`${d.color}22`,color:d.color,fontFamily:"'Space Mono'",fontWeight:700}}>{d.emoji} {d.name}</span>;
};

const ColorBar = ({color}) => <div style={{height:2.5,background:`linear-gradient(90deg,${color},${color}44)`}}/>;

/* ═══════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════ */
export default function FanDrop() {
  const [tab, setTab] = useState("home");
  const [myIdols, setMyIdols] = useState(["bts","bp"]);
  const [savedEvent, setSavedEvent] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [openFanchant, setOpenFanchant] = useState(null);
  const [glossSearch, setGlossSearch] = useState("");
  const [fanSection, setFanSection] = useState("fanchant");
  const [toasts, setToasts] = useState([]);
  const [showOnboard, setShowOnboard] = useState(true);
  const [aiMode, setAiMode] = useState("idle"); // idle | loading | done
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const aiEndRef = useRef(null);
  // Style AI state
  const [stylePrompt, setStylePrompt] = useState("");
  const [styleIdol, setStyleIdol] = useState("bts");
  const [styleEra, setStyleEra] = useState("");
  const [styleMode, setStyleMode] = useState("idle"); // idle|loading|done
  const [styleResults, setStyleResults] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [showWishlist, setShowWishlist] = useState(false);
  const fileRef = useRef();

  const pushToast = useCallback((msg) => {
    const id = Date.now();
    setToasts(t=>[...t,{id,msg}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),2600);
  },[]);

  const toggleCheck = (key) => setCheckedItems(c=>({...c,[key]:!c[key]}));
  const toggleIdol = (id) => setMyIdols(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);

  const myIdolData = myIdols.map(id=>getIdol(id)).filter(Boolean);
  const primary = myIdolData[0] || IDOLS[0];

  // AI Fandom Assistant using Anthropic API
  const sendAiMessage = async () => {
    if(!aiInput.trim() || aiMode === "loading") return;
    const userMsg = aiInput.trim();
    setAiInput("");
    setAiMessages(m=>[...m,{role:"user",content:userMsg}]);
    setAiMode("loading");
    try {
      const hist = [...aiMessages,{role:"user",content:userMsg}];
      const response = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are a knowledgeable, enthusiastic K-pop fan assistant named FANI. You know everything about K-pop — groups, members, songs, albums, concerts, photocards, fan culture, Korean idol industry, merchandise, fanchants, and fan communities. You're warm, relatable, and talk like a fellow fan. Keep responses concise (2–4 sentences max unless listing things). Use relevant emoji sparingly. You help fans solve real problems: finding merch, learning fanchants, understanding K-pop culture, planning concerts, budgeting for fan activities, and staying up to date on releases. Current date: May 2026.`,
          messages:hist
        })
      });
      const data = await response.json();
      const reply = data.content?.find(b=>b.type==="text")?.text || "Sorry, I couldn't find an answer — try rephrasing! 💜";
      setAiMessages(m=>[...m,{role:"assistant",content:reply}]);
      setAiMode("done");
    } catch(e) {
      setAiMessages(m=>[...m,{role:"assistant",content:"Oops, something went wrong. Check your connection and try again! 💜"}]);
      setAiMode("done");
    }
  };

  useEffect(()=>{
    if(aiEndRef.current) aiEndRef.current.scrollIntoView({behavior:"smooth"});
  },[aiMessages]);

  const completedChecks = Object.values(checkedItems).filter(Boolean).length;
  const totalChecks = CONCERT_KIT.reduce((a,p)=>a+p.items.length,0);

  const TABS = [
    {id:"home",icon:"⚡",label:"Home"},
    {id:"events",icon:"🎟",label:"Events"},
    {id:"drops",icon:"🎵",label:"Drops"},
    {id:"style",icon:"👗",label:"AI Style"},
    {id:"fani",icon:"🤖",label:"FANI"},
    {id:"fan",icon:"💜",label:"Fan Hub"},
  ];

  const css = `
    ${G}
    :root{
      --bg:#06040e;
      --s1:rgba(255,255,255,.055);
      --b1:rgba(255,255,255,.08);
      --t1:#f0eaff;
      --t2:rgba(255,255,255,.45);
      --t3:rgba(255,255,255,.22);
      --a1:${primary.color};
      --a2:#f472b6;
      --grad:linear-gradient(135deg,${primary.color},#f472b6);
      --gc:${primary.color.replace('#','').match(/../g).map(x=>parseInt(x,16)).join(',')};
    }
  `;

  // ── ONBOARD ────────────────────────────────────────────────────────────────
  if(showOnboard) return (
    <div style={{fontFamily:"'DM Sans'",background:"#06040e",minHeight:"100vh",color:"#f0eaff",display:"flex",justifyContent:"center"}}>
      <style>{G}</style>
      <div style={{width:"100%",maxWidth:430,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"40px 24px 32px"}}>
          <div style={{textAlign:"center",marginBottom:36}}>
            <div style={{fontSize:52,marginBottom:14}}>🎶</div>
            <div className="h1 gradient-text" style={{fontSize:42,marginBottom:8,background:"linear-gradient(135deg,#fff,#c084fc 55%,#f472b6)"}}>FanDrop</div>
            <div className="sans" style={{fontSize:14,color:"rgba(255,255,255,.4)",lineHeight:1.7}}>The fan app built for real K-pop fans.<br/>Pick your groups to get started.</div>
          </div>
          <Lbl>Who do you stan? (pick all that apply)</Lbl>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}}>
            {IDOLS.map(idol=>{
              const sel = myIdols.includes(idol.id);
              return (
                <div key={idol.id} className="tap" onClick={()=>toggleIdol(idol.id)}
                  style={{borderRadius:16,border:`1.5px solid ${sel?idol.color+"66":"rgba(255,255,255,.08)"}`,background:sel?`${idol.color}14`:"rgba(255,255,255,.03)",padding:"13px 14px",transition:"all .2s"}}>
                  <div style={{fontSize:22,marginBottom:5}}>{idol.emoji}</div>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:1}}>{idol.name}</div>
                  <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>{idol.fandom}</div>
                  {sel && <div style={{marginTop:6,width:"100%",height:2,borderRadius:1,background:idol.color}}/>}
                </div>
              );
            })}
          </div>
          <button className="tap" onClick={()=>setShowOnboard(false)} disabled={myIdols.length===0}
            style={{width:"100%",padding:"16px",borderRadius:16,border:"none",background:myIdols.length>0?"linear-gradient(135deg,#7c3aed,#ec4899)":"rgba(255,255,255,.07)",color:myIdols.length>0?"#fff":"rgba(255,255,255,.25)",fontSize:14,fontWeight:700,cursor:myIdols.length>0?"pointer":"default",fontFamily:"'Syne'",letterSpacing:"-.01em"}}>
            Enter FanDrop {myIdols.length>0?`— ${myIdols.length} group${myIdols.length>1?"s":""} selected`:""}
          </button>
          <div className="sans" style={{textAlign:"center",marginTop:12,fontSize:11,color:"rgba(255,255,255,.2)"}}>You can change your groups anytime in Fan Hub</div>
        </div>
      </div>
    </div>
  );

  // ── STYLE AI ──────────────────────────────────────────────────────────────
  const toggleWish = (item) => {
    const has = wishlist.find(x=>x.name===item.name);
    setWishlist(w => has ? w.filter(x=>x.name!==item.name) : [...w, item]);
    pushToast(has ? "Removed from wishlist" : "❤️ Saved to wishlist!");
  };

  const generateStyle = async () => {
    if(styleMode==="loading") return;
    setStyleMode("loading");
    setStyleResults(null);
    const idol = getIdol(styleIdol);
    const prompt = stylePrompt.trim() || `${idol?.name} ${styleEra||idol?.era} era fan outfit`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are a K-pop fashion stylist expert. Given a style request, return ONLY a valid JSON object (no markdown, no explanation) with this structure:
{
  "look": "Short look name",
  "vibe": "2-sentence description of the aesthetic",
  "items": [
    {
      "cat": "Category (Top/Bottom/Shoes/Outer/Bag/Accessory)",
      "name": "Specific product name",
      "store": "Store name (choose from: ASOS, YesStyle, Zara, H&M, Urban Outfitters, & Other Stories, Mango, SHEIN)",
      "price": "$XX",
      "budget": "Budget dupe store + price (e.g. SHEIN $9)",
      "url": "https://[store].com (use real domain)",
      "why": "1 sentence why it fits the look"
    }
  ]
}
Return exactly 5 items. Focus on real, purchasable K-pop inspired fashion. Mix high street and budget options.`,
          messages:[{role:"user",content:`Create a K-pop fan outfit for: ${prompt}`}]
        })
      });
      const data = await res.json();
      const raw = data.content?.find(b=>b.type==="text")?.text||"";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if(!jsonMatch) throw new Error("No JSON");
      setStyleResults(JSON.parse(jsonMatch[0]));
      setStyleMode("done");
    } catch(e) {
      pushToast("Couldn't generate — try again!");
      setStyleMode("idle");
    }
  };

  const STYLE_PRESETS = [
    {label:"Airport OOTD",icon:"✈️",prompt:"K-pop idol airport fashion, oversized blazer, casual luxury streetwear"},
    {label:"Concert Fan",icon:"🎟",prompt:"K-pop concert fan outfit, lightstick-friendly, comfortable yet stylish"},
    {label:"Stage Glam",icon:"✨",prompt:"K-pop idol stage performance look, bold, eye-catching, performance ready"},
    {label:"Soft Girl",icon:"🌸",prompt:"K-pop soft girl aesthetic, pastel tones, feminine, cute everyday look"},
    {label:"Y2K Kpop",icon:"💿",prompt:"Y2K inspired K-pop fashion, low rise, rhinestones, retro futuristic"},
    {label:"Dark & Edgy",icon:"🖤",prompt:"Dark K-pop idol aesthetic, all-black, leather, edgy streetwear"},
  ];

  const StyleTab = () => (
    <div style={{overflowY:"auto",paddingBottom:90}}>
      {/* Wishlist FAB */}
      {wishlist.length>0 && (
        <button className="tap" onClick={()=>setShowWishlist(v=>!v)} style={{position:"fixed",top:14,right:14,zIndex:400,width:40,height:40,borderRadius:12,background:"rgba(244,63,94,.15)",border:"1px solid rgba(244,63,94,.3)",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
          ❤️<span style={{position:"absolute",top:-4,right:-4,width:17,height:17,borderRadius:"50%",background:"#f43f5e",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #06040e",fontFamily:"'Space Mono'"}}>{wishlist.length}</span>
        </button>
      )}

      {/* Wishlist Drawer */}
      {showWishlist && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(10px)",zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowWishlist(false)}>
          <div className="fade" style={{width:"100%",maxWidth:430,background:"#0c0718",borderRadius:"22px 22px 0 0",border:"1px solid rgba(255,255,255,.08)",padding:"18px 18px 40px",maxHeight:"72vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,.12)",margin:"0 auto 18px"}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:700,fontFamily:"'Syne'"}}>❤️ Wishlist ({wishlist.length})</div>
              <button className="tap" onClick={()=>setShowWishlist(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",fontSize:18,cursor:"pointer"}}>×</button>
            </div>
            {wishlist.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"11px 0",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                <div style={{width:40,height:40,borderRadius:10,background:"rgba(255,255,255,.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>👗</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:1}}>{item.name}</div>
                  <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>{item.store} · {item.price}</div>
                </div>
                <div style={{display:"flex",gap:7}}>
                  <a href={item.url} target="_blank" rel="noreferrer"><button className="tap" style={{padding:"6px 12px",borderRadius:9,border:"1px solid rgba(192,132,252,.25)",background:"rgba(192,132,252,.1)",color:"#c084fc",fontSize:10,cursor:"pointer",fontFamily:"'Space Mono'"}}>Buy ↗</button></a>
                  <button className="tap" onClick={()=>toggleWish(item)} style={{padding:"6px 10px",borderRadius:9,border:"1px solid rgba(244,63,94,.2)",background:"rgba(244,63,94,.08)",color:"#f43f5e",fontSize:10,cursor:"pointer"}}>×</button>
                </div>
              </div>
            ))}
            <div className="sans" style={{marginTop:12,fontSize:9,color:"rgba(255,255,255,.18)",textAlign:"center"}}>All links are affiliate — FanDrop earns a commission at no extra cost to you</div>
          </div>
        </div>
      )}

      <div style={{padding:"52px 22px 14px",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:200,background:"radial-gradient(ellipse at 30% 0%,rgba(236,72,153,.12),transparent 70%)",pointerEvents:"none"}}/>
        <Lbl>AI-Powered · Affiliate Commerce</Lbl>
        <div className="h1" style={{fontSize:28,marginBottom:4}}>AI Style<br/>Finder</div>
        <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.38)",lineHeight:1.65}}>Describe any K-pop look → get shoppable outfit recommendations with real purchase links and budget dupes.</div>
      </div>

      {/* Affiliate notice */}
      <div style={{margin:"0 20px 16px",padding:"9px 13px",borderRadius:13,background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.15)",display:"flex",gap:9,alignItems:"center"}}>
        <span style={{fontSize:14}}>💸</span>
        <div className="sans" style={{fontSize:11,color:"rgba(251,191,36,.8)",lineHeight:1.5}}>Every "Buy ↗" earns FanDrop a commission via affiliate programs — at no extra cost to you.</div>
      </div>

      {/* Style input area */}
      <div style={{padding:"0 20px 16px"}}>
        {/* Idol selector */}
        <Lbl style={{marginBottom:9}}>Base it on a group's style</Lbl>
        <div className="hrow" style={{marginBottom:14}}>
          {IDOLS.slice(0,6).map(idol=>(
            <button key={idol.id} className="tap pill" onClick={()=>setStyleIdol(idol.id)} style={{flexShrink:0,background:styleIdol===idol.id?`${idol.color}20`:"rgba(255,255,255,.04)",color:styleIdol===idol.id?idol.color:"rgba(255,255,255,.3)",border:`1px solid ${styleIdol===idol.id?idol.color+"44":"rgba(255,255,255,.07)"}`}}>
              {idol.emoji} {idol.name}
            </button>
          ))}
        </div>

        {/* Preset vibes */}
        <Lbl style={{marginBottom:9}}>Quick style presets</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          {STYLE_PRESETS.map((p,i)=>(
            <button key={i} className="tap" onClick={()=>setStylePrompt(p.prompt)} style={{borderRadius:13,border:`1px solid ${stylePrompt===p.prompt?"rgba(192,132,252,.4)":"rgba(255,255,255,.07)"}`,background:stylePrompt===p.prompt?"rgba(192,132,252,.1)":"rgba(255,255,255,.03)",padding:"10px 8px",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{p.icon}</div>
              <div className="sans" style={{fontSize:10,fontWeight:600,color:stylePrompt===p.prompt?"#c084fc":"rgba(255,255,255,.55)",lineHeight:1.3}}>{p.label}</div>
            </button>
          ))}
        </div>

        {/* Custom prompt */}
        <Lbl style={{marginBottom:8}}>Or describe your own look</Lbl>
        <div style={{borderRadius:14,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",padding:"12px 14px",marginBottom:14}}>
          <textarea value={stylePrompt} onChange={e=>setStylePrompt(e.target.value)} placeholder="e.g. BTS Butter era pastel summer look, or BLACKPINK Paris Fashion Week street style…" rows={2} style={{width:"100%",background:"none",border:"none",color:"#f0eaff",fontSize:13,resize:"none",outline:"none",lineHeight:1.55}}/>
        </div>

        <button className="tap" onClick={generateStyle} disabled={styleMode==="loading"} style={{width:"100%",padding:"15px",borderRadius:15,border:"none",background:styleMode==="loading"?"rgba(192,132,252,.15)":"linear-gradient(135deg,#7c3aed,#ec4899)",color:"#fff",fontSize:13,fontWeight:700,cursor:styleMode==="loading"?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:9,fontFamily:"'Syne'",letterSpacing:"-.01em",boxShadow:styleMode!=="loading"?"0 8px 28px rgba(124,58,237,.35)":"none",transition:"all .2s"}}>
          {styleMode==="loading" ? (
            <><div className="spin" style={{width:18,height:18,border:"2px solid rgba(255,255,255,.25)",borderTopColor:"#fff",borderRadius:"50%"}}/>Styling your look…</>
          ) : (
            <>✨ Generate Outfit & Shop Links</>
          )}
        </button>
      </div>

      {/* Results */}
      {styleResults && (
        <div className="fade" style={{padding:"0 20px 24px"}}>
          {/* Look header */}
          <div style={{borderRadius:18,background:"linear-gradient(135deg,rgba(124,58,237,.15),rgba(236,72,153,.08))",border:"1px solid rgba(192,132,252,.2)",padding:"16px 16px",marginBottom:14}}>
            <div className="lbl" style={{color:"#c084fc",marginBottom:6}}>✨ Your Generated Look</div>
            <div className="h1" style={{fontSize:20,marginBottom:6}}>{styleResults.look}</div>
            <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.48)",lineHeight:1.65}}>{styleResults.vibe}</div>
          </div>

          {/* Outfit items */}
          <Lbl style={{marginBottom:10}}>🛍 Shop the Look <span style={{marginLeft:6}}><AffTag/></span></Lbl>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {(styleResults.items||[]).map((item,i)=>{
              const inWish = wishlist.find(x=>x.name===item.name);
              return (
                <div key={i} className="card fade s1" style={{overflow:"hidden",animationDelay:`${i*.05}s`}}>
                  <div style={{height:2,background:`linear-gradient(90deg,#7c3aed,#ec4899)`}}/>
                  <div style={{padding:"12px 13px",display:"flex",gap:11,alignItems:"flex-start"}}>
                    <div style={{width:48,height:48,borderRadius:13,background:"rgba(192,132,252,.1)",border:"1px solid rgba(192,132,252,.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:20}}>
                      {item.cat==="Top"?"👕":item.cat==="Bottom"?"👖":item.cat==="Shoes"?"👟":item.cat==="Outer"?"🧥":item.cat==="Bag"?"👜":"💍"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:9,color:"#a78bfa",fontFamily:"'Space Mono'",letterSpacing:".1em",marginBottom:2}}>{item.cat.toUpperCase()}</div>
                      <div style={{fontSize:13,fontWeight:700,marginBottom:2,lineHeight:1.2}}>{item.name}</div>
                      <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)",marginBottom:5}}>{item.store}</div>
                      <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.45)",lineHeight:1.5,marginBottom:7,fontStyle:"italic"}}>"{item.why}"</div>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:12,fontWeight:700,fontFamily:"'Space Mono'",color:"#fff"}}>{item.price}</span>
                        {item.budget && <span style={{fontSize:10,fontFamily:"'Space Mono'",color:"#22c55e"}}>💚 {item.budget}</span>}
                      </div>
                    </div>
                    <button className="tap" onClick={()=>toggleWish(item)} style={{width:32,height:32,borderRadius:9,border:`1px solid ${inWish?"rgba(244,63,94,.35)":"rgba(255,255,255,.1)"}`,background:inWish?"rgba(244,63,94,.12)":"rgba(255,255,255,.04)",fontSize:14,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {inWish?"❤️":"🤍"}
                    </button>
                  </div>
                  <div style={{padding:"0 13px 12px",display:"flex",gap:8}}>
                    <a href={item.url} target="_blank" rel="noreferrer" style={{flex:1}}>
                      <button className="tap" style={{width:"100%",padding:"10px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#7c3aed,#ec4899)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Space Mono'"}}>Buy at {item.store} ↗</button>
                    </a>
                    {item.budget && (() => {
                      const budgetStore = item.budget.split(" ")[0].toLowerCase();
                      const budgetUrl = budgetStore==="shein"?"https://shein.com":budgetStore==="temu"?"https://temu.com":budgetStore==="romwe"?"https://romwe.com":"https://yesstyle.com";
                      return (
                        <a href={budgetUrl} target="_blank" rel="noreferrer">
                          <button className="tap" style={{padding:"10px 13px",borderRadius:12,border:"1px solid rgba(34,197,94,.25)",background:"rgba(34,197,94,.08)",color:"#22c55e",fontSize:11,cursor:"pointer",fontFamily:"'Space Mono'",whiteSpace:"nowrap"}}>💚 Dupe</button>
                        </a>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* FANI upsell */}
          <div className="tap card" onClick={()=>setTab("fani")} style={{marginTop:14,padding:"14px 14px",display:"flex",gap:12,alignItems:"center",background:"rgba(124,58,237,.08)",border:"1px solid rgba(192,132,252,.18)"}}>
            <div style={{fontSize:22}}>🤖</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>Ask FANI for more styling tips</div>
              <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)"}}>Get personalised fashion & fan advice from your AI assistant</div>
            </div>
            <div style={{fontSize:18,color:"rgba(255,255,255,.18)"}}>›</div>
          </div>

          <div style={{marginTop:10,padding:"8px",borderRadius:10,background:"rgba(255,255,255,.02)"}}>
            <div className="sans" style={{fontSize:9,color:"rgba(255,255,255,.18)",textAlign:"center"}}>Affiliate disclosure · FanDrop earns a commission on purchases at no extra cost to you · Prices may vary · AI-generated suggestions</div>
          </div>

          <button className="tap" onClick={()=>{setStyleResults(null);setStyleMode("idle");setStylePrompt("");}} style={{marginTop:12,width:"100%",padding:"10px",borderRadius:12,border:"1px solid rgba(255,255,255,.07)",background:"transparent",color:"rgba(255,255,255,.3)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans'"}}>← Generate another look</button>
        </div>
      )}
    </div>
  );

  // ── HOME ───────────────────────────────────────────────────────────────────
  const HomeTab = () => {
    const event = savedEvent ? EVENTS.find(e=>e.id===savedEvent) : null;
    const days = event ? getDays(event.date) : null;
    return (
      <div style={{overflowY:"auto",paddingBottom:90}}>
        {/* Header */}
        <div style={{padding:"52px 22px 20px",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:220,background:`radial-gradient(ellipse at 70% -10%,${primary.color}18 0%,transparent 70%)`,pointerEvents:"none"}}/>
          <Lbl>Your K-Pop Universe</Lbl>
          <div className="h1 gradient-text" style={{fontSize:44,marginBottom:6,background:`linear-gradient(135deg,#fff 0%,${primary.color} 55%,#f472b6 100%)`}}>FanDrop</div>
          <div className="sans" style={{fontSize:13,color:"rgba(255,255,255,.38)",lineHeight:1.6}}>Concerts · Drops · Fan Tools · AI Fandom Assistant</div>
          {/* My Idols row */}
          <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
            {myIdolData.map(idol=>(
              <div key={idol.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,background:`${idol.color}14`,border:`1px solid ${idol.color}28`}}>
                <span style={{fontSize:14}}>{idol.emoji}</span>
                <span style={{fontSize:11,fontWeight:700,color:idol.color,fontFamily:"'Space Mono'"}}>{idol.name}</span>
              </div>
            ))}
            <div className="tap" onClick={()=>setTab("fan")} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",cursor:"pointer"}}>
              <span style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>+ Edit</span>
            </div>
          </div>
        </div>

        {/* Concert countdown card */}
        {event ? (
          <div className="tap shimmer fade" onClick={()=>setTab("events")} style={{margin:"0 20px 18px",borderRadius:22,background:`linear-gradient(135deg,${getIdol(event.idol)?.color||"#7c3aed"}1a,rgba(255,255,255,.03))`,border:`1px solid ${getIdol(event.idol)?.color||"#7c3aed"}30`,padding:"18px 20px",overflow:"hidden",position:"relative"}}>
            <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:`${getIdol(event.idol)?.color||"#7c3aed"}0d`}}/>
            <Lbl style={{color:getIdol(event.idol)?.color||"#7c3aed"}}>🎟 My Concert · Tap for Full Kit</Lbl>
            <div style={{display:"flex",alignItems:"flex-end",gap:10,marginBottom:8}}>
              <div className="h1" style={{fontSize:64,color:getIdol(event.idol)?.color||"#7c3aed",lineHeight:1}}>{days}</div>
              <div className="sans" style={{fontSize:14,color:"rgba(255,255,255,.4)",marginBottom:10}}>days to go</div>
            </div>
            <div style={{fontSize:15,fontWeight:700,marginBottom:3}}>{event.artist} {getIdol(event.idol)?.emoji||"🎵"}</div>
            <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)"}}>{event.venue} · {event.country}</div>
            {days<=14 && <div style={{marginTop:10,display:"inline-flex",gap:6,alignItems:"center",padding:"6px 13px",borderRadius:20,background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.22)",color:"#ef4444",fontSize:11,fontFamily:"'Space Mono'",fontWeight:700}}><div className="live-dot"/> {days}d — Concert Kit urgent!</div>}
          </div>
        ):(
          <div className="tap fade card" onClick={()=>setTab("events")} style={{margin:"0 20px 18px",padding:"16px 18px",display:"flex",gap:14,alignItems:"center",border:"1.5px dashed rgba(192,132,252,.2)"}}>
            <div style={{fontSize:30}}>🎟</div>
            <div><div style={{fontSize:13,fontWeight:700,marginBottom:2}}>Save a Concert → Get Your Prep Kit</div><div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>Checklist, tickets, merch — all in one</div></div>
            <div style={{marginLeft:"auto",fontSize:20,color:"rgba(255,255,255,.18)"}}>›</div>
          </div>
        )}

        {/* Recent drops for my idols */}
        <div style={{padding:"0 22px 10px"}}><Lbl>🎵 My Group Drops</Lbl></div>
        <div className="hrow" style={{padding:"0 20px 18px"}}>
          {DROPS.filter(d=>myIdols.includes(d.idol)||!d.idol).slice(0,6).map((d,i)=>{
            const idol = d.idol ? getIdol(d.idol) : null;
            return (
              <div key={i} className="tap" onClick={()=>d.ytUrl&&window.open(d.ytUrl,"_blank")} style={{flexShrink:0,width:140,borderRadius:16,background:idol?`${idol.color}14`:"rgba(255,255,255,.05)",border:`1px solid ${idol?idol.color+"28":"rgba(255,255,255,.07)"}`,padding:"12px 12px 10px",animationDelay:`${i*.04}s`}}>
                <div style={{fontSize:9,color:idol?idol.color:"rgba(255,255,255,.35)",fontFamily:"'Space Mono'",letterSpacing:".07em",marginBottom:3}}>{d.type.toUpperCase()}</div>
                <div style={{fontSize:12,fontWeight:700,lineHeight:1.2,marginBottom:3}}>{d.title}</div>
                <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.38)",marginBottom:7}}>{d.artist}</div>
                <div style={{fontSize:10,color:d.daysAgo===0?"#ef4444":d.daysAgo<0?"rgba(255,255,255,.3)":idol?idol.color:"#22c55e",fontFamily:"'Space Mono'"}}>{d.daysAgo===0?"🔴 TODAY":d.daysAgo<0?`In ${Math.abs(d.daysAgo)}d`:`${d.daysAgo}d ago`}</div>
              </div>
            );
          })}
        </div>

        {/* FANI AI promo */}
        <div className="tap fade card" onClick={()=>setTab("fani")} style={{margin:"0 20px 18px",padding:"18px 18px",background:"linear-gradient(135deg,rgba(124,58,237,.14),rgba(244,114,182,.08))",border:"1px solid rgba(192,132,252,.2)"}}>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <div style={{width:50,height:50,borderRadius:16,background:"linear-gradient(135deg,#7c3aed,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🤖</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}><div style={{fontSize:14,fontWeight:700}}>FANI — Your AI Fan Assistant</div><div style={{display:"flex",gap:4,alignItems:"center"}}><div className="live-dot"/><span style={{fontSize:9,color:"#ef4444",fontFamily:"'Space Mono'"}}>LIVE</span></div></div>
              <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.45)",lineHeight:1.6}}>Ask anything K-pop. Fanchants, merch advice, concert prep, music history — powered by Claude AI.</div>
            </div>
            <div style={{fontSize:18,color:"rgba(255,255,255,.18)"}}>›</div>
          </div>
        </div>

        {/* Quick grid */}
        <div style={{padding:"0 20px 28px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {icon:"🎤",label:"Fanchants",sub:"Learn before the show",tab:"fan",section:"fanchant",c:"#7c3aed"},
            {icon:"📋",label:"Concert Kit",sub:"Full prep checklist",tab:"events",c:"#f97316"},
            {icon:"🛍",label:"Official Merch",sub:"Where to shop safe",tab:"fan",section:"merch",c:"#ec4899"},
            {icon:"💰",label:"Budget Tips",sub:"Fan on a budget",tab:"fan",section:"budget",c:"#22c55e"},
            {icon:"📖",label:"K-Pop Glossary",sub:"New fan? Start here",tab:"fan",section:"glossary",c:"#60a5fa"},
            {icon:"🎵",label:"New Drops",sub:"Latest releases",tab:"drops",c:"#f43f5e"},
          ].map((item,i)=>(
            <div key={i} className={`card tap fade s${i+1}`} onClick={()=>{setTab(item.tab);if(item.section)setFanSection(item.section);}} style={{padding:"16px 14px"}}>
              <div style={{fontSize:24,marginBottom:8}}>{item.icon}</div>
              <div className="h1" style={{fontSize:13,marginBottom:3}}>{item.label}</div>
              <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>{item.sub}</div>
              <div style={{marginTop:10,width:22,height:2.5,borderRadius:2,background:item.c}}/>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── EVENTS / CONCERT KIT ────────────────────────────────────────────────────
  const EventsTab = () => {
    const event = savedEvent ? EVENTS.find(e=>e.id===savedEvent) : null;
    const days = event ? getDays(event.date) : null;
    const idol = event ? getIdol(event.idol) : null;
    return (
      <div style={{overflowY:"auto",paddingBottom:90}}>
        <div style={{padding:"52px 22px 16px"}}>
          <Lbl>Upcoming Shows + Full Kit</Lbl>
          <div className="h1" style={{fontSize:28,marginBottom:4}}>Concert<br/>Planner</div>
          <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.38)",lineHeight:1.6}}>Pick your concert → get tickets, merch, outfit links + a personalised prep checklist.</div>
        </div>

        {/* Concert picker */}
        <div style={{padding:"0 20px 18px",display:"flex",flexDirection:"column",gap:9}}>
          {EVENTS.map(ev=>{
            const evIdol = getIdol(ev.idol);
            const dy = getDays(ev.date);
            const sel = savedEvent === ev.id;
            return (
              <div key={ev.id} className="tap" onClick={()=>{setSavedEvent(ev.id);pushToast(`${evIdol?.emoji||"🎵"} ${ev.artist} concert saved!`);}}
                style={{borderRadius:18,background:sel?`${evIdol?.color||"#7c3aed"}16`:"rgba(255,255,255,.04)",border:`1.5px solid ${sel?(evIdol?.color||"#7c3aed")+"44":"rgba(255,255,255,.07)"}`,padding:"13px 14px",display:"flex",gap:12,alignItems:"center",transition:"all .2s"}}>
                <div style={{width:44,height:44,borderRadius:13,background:`${evIdol?.color||"#7c3aed"}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{evIdol?.emoji||"🎵"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:1}}>{ev.artist} {ev.country}</div>
                  <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.38)",marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ev.venue}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:9,padding:"2px 8px",borderRadius:18,background:`${evIdol?.color||"#7c3aed"}14`,color:evIdol?.color||"#7c3aed",fontFamily:"'Space Mono'",fontWeight:700}}>{dy}d away</span>
                    <span style={{fontSize:9,padding:"2px 8px",borderRadius:18,background:"rgba(34,211,153,.1)",color:"#34d399",fontFamily:"'Space Mono'"}}>{ev.price}</span>
                  </div>
                </div>
                {sel && <div style={{fontSize:16,color:evIdol?.color||"#7c3aed",flexShrink:0}}>✓</div>}
              </div>
            );
          })}
        </div>

        {/* Concert Kit */}
        {event && (
          <div className="fade" style={{padding:"0 20px 20px"}}>
            <div style={{borderRadius:22,background:`linear-gradient(135deg,${idol?.color||"#7c3aed"}10,rgba(255,255,255,.02))`,border:`1px solid ${idol?.color||"#7c3aed"}28`,overflow:"hidden",marginBottom:14}}>
              <div style={{padding:"16px 16px 12px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                <Lbl style={{color:idol?.color}}>🎟 Concert Kit</Lbl>
                <div style={{fontSize:15,fontWeight:700}}>{days} days · {event.artist} · {event.venue}</div>
              </div>

              {/* Ticket */}
              <div style={{padding:"13px 16px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:700}}>🎟 Get Tickets</div><AffTag/>
                  {days<=14 && <span style={{fontSize:9,padding:"2px 8px",borderRadius:18,background:"rgba(239,68,68,.12)",color:"#ef4444",fontFamily:"'Space Mono'"}}>⚡ {days}d left</span>}
                </div>
                <div style={{display:"flex",gap:7}}>
                  <a href={event.ticketUrl} target="_blank" rel="noreferrer" style={{flex:1}}>
                    <button className="tap" style={{width:"100%",padding:"11px",borderRadius:13,border:"none",background:`linear-gradient(135deg,${idol?.color||"#7c3aed"},${idol?.color||"#7c3aed"}88)`,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Space Mono'"}}>
                      Buy Tickets ↗ {event.price}
                    </button>
                  </a>
                  <a href="https://vividseats.com" target="_blank" rel="noreferrer">
                    <button className="tap" style={{padding:"11px 13px",borderRadius:13,border:`1px solid ${idol?.color||"#7c3aed"}28`,background:`${idol?.color||"#7c3aed"}10`,color:idol?.color||"#7c3aed",fontSize:11,cursor:"pointer",fontFamily:"'Space Mono'"}}>VividSeats</button>
                  </a>
                </div>
              </div>

              {/* Official merch */}
              <div style={{padding:"13px 16px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:700}}>🌐 Official Merch</div><AffTag/>
                </div>
                <div style={{display:"flex",gap:7}}>
                  {["Weverse","Ktown4u"].map(shop=>(
                    <a key={shop} href={shop==="Weverse"?"https://weverse.io":"https://ktown4u.com"} target="_blank" rel="noreferrer" style={{flex:1}}>
                      <button className="tap" style={{width:"100%",padding:"9px",borderRadius:12,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.65)",fontSize:11,cursor:"pointer",fontFamily:"'Space Mono'"}}>{shop} ↗</button>
                    </a>
                  ))}
                </div>
              </div>

              {/* Checklist progress */}
              <div style={{padding:"13px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:700}}>📋 Prep Checklist</div>
                  <div style={{fontSize:10,fontFamily:"'Space Mono'",color:idol?.color||"#7c3aed"}}>{completedChecks}/{totalChecks} done</div>
                </div>
                <div className="progress" style={{marginBottom:10}}>
                  <div className="progress-fill" style={{width:`${totalChecks>0?(completedChecks/totalChecks)*100:0}%`,background:`linear-gradient(90deg,${idol?.color||"#7c3aed"},#f472b6)`}}/>
                </div>
                {CONCERT_KIT.map((phase,pi)=>(
                  <div key={pi} style={{marginBottom:12}}>
                    <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:8}}>
                      <span style={{fontSize:14}}>{phase.icon}</span>
                      <div style={{fontSize:11,fontWeight:700,color:phase.color,fontFamily:"'Space Mono'"}}>{phase.phase}</div>
                    </div>
                    {phase.items.map((item,ii)=>{
                      const key=`${pi}-${ii}`, done=checkedItems[key];
                      return (
                        <div key={ii} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                          <div className="tap check-box" onClick={()=>toggleCheck(key)} style={{borderColor:done?phase.color:"rgba(255,255,255,.12)",background:done?`${phase.color}20`:"transparent"}}>
                            {done && <span style={{fontSize:11,color:phase.color}}>✓</span>}
                          </div>
                          <div style={{flex:1}}>
                            <div className="sans" style={{fontSize:12,color:done?"rgba(255,255,255,.28)":"rgba(255,255,255,.8)",textDecoration:done?"line-through":"none",lineHeight:1.4}}>{item.t}</div>
                            {item.aff && <a href={item.url} target="_blank" rel="noreferrer"><div style={{marginTop:3,display:"inline-flex",gap:4,alignItems:"center",fontSize:10,color:"#fbbf24"}}><AffTag/><span style={{fontFamily:"'Space Mono'"}}>{item.tag} ↗</span></div></a>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.18)",textAlign:"center"}}>Ticket & merch links are affiliate links · Prices may vary · FanDrop earns a commission</div>
          </div>
        )}
      </div>
    );
  };

  // ── DROPS ─────────────────────────────────────────────────────────────────
  const DropsTab = () => (
    <div style={{overflowY:"auto",paddingBottom:90}}>
      <div style={{padding:"52px 22px 16px"}}>
        <Lbl>April – May 2026</Lbl>
        <div className="h1" style={{fontSize:28}}>New Music<br/>Drops</div>
      </div>
      <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:11,paddingBottom:24}}>
        {DROPS.map((d,i)=>{
          const idol = d.idol ? getIdol(d.idol) : null;
          const upcoming = d.daysAgo < 0;
          return (
            <div key={i} className="card fade" style={{animationDelay:`${i*.04}s`,overflow:"hidden"}}>
              <ColorBar color={idol?.color||"#6b7280"}/>
              <div style={{padding:"13px 13px 11px",display:"flex",gap:11,alignItems:"flex-start"}}>
                <div style={{width:44,height:44,borderRadius:12,background:`${idol?.color||"#6b7280"}16`,border:`1px solid ${idol?.color||"#6b7280"}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                  {upcoming?"📅":d.daysAgo===0?"🔴":"🎵"}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                    <span style={{fontSize:13,fontWeight:700}}>{d.title}</span>
                    {d.daysAgo===0 && <span style={{fontSize:9,padding:"2px 8px",borderRadius:18,background:"rgba(239,68,68,.18)",color:"#ef4444",fontFamily:"'Space Mono'",fontWeight:700}}>NEW</span>}
                  </div>
                  <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)",marginBottom:8}}>{d.artist} · {d.type} · {d.date}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                    {!upcoming && d.ytUrl && <a href={d.ytUrl} target="_blank" rel="noreferrer"><button className="tap pill" style={{background:"rgba(239,68,68,.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,.2)",fontSize:10}}>▶ YouTube</button></a>}
                    {!upcoming && <span style={{fontSize:10,padding:"3px 10px",borderRadius:18,background:`${idol?.color||"#6b7280"}12`,color:idol?.color||"rgba(255,255,255,.4)",fontFamily:"'Space Mono'"}}>{d.views}</span>}
                    {upcoming && <span className="sans" style={{fontSize:10,padding:"3px 10px",borderRadius:18,background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.33)"}}>Drops in {Math.abs(d.daysAgo)} days</span>}
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

  // ── FANI AI ────────────────────────────────────────────────────────────────
  const FaniTab = () => {
    const QUICK = [
      "What should I buy first as a new ARMY?",
      "How do I learn BTS fanchants fast?",
      "Best budget way to collect photocards?",
      "What are the best K-pop albums of 2026?",
      "How early should I arrive at a K-pop concert?",
      "What is the difference between Melon and Spotify charts?",
    ];
    return (
      <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 60px)",paddingBottom:0}}>
        {/* Header */}
        <div style={{padding:"52px 22px 16px",borderBottom:"1px solid rgba(255,255,255,.06)",flexShrink:0}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:46,height:46,borderRadius:14,background:"linear-gradient(135deg,#7c3aed,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🤖</div>
            <div>
              <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:1}}>
                <div className="h1" style={{fontSize:18}}>FANI</div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}><div className="live-dot"/><span style={{fontSize:9,color:"#ef4444",fontFamily:"'Space Mono'"}}>AI LIVE</span></div>
              </div>
              <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)"}}>Powered by Claude · Ask anything K-pop</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
          {aiMessages.length===0 && (
            <div className="fade">
              <div style={{textAlign:"center",padding:"20px 0 24px"}}>
                <div style={{fontSize:40,marginBottom:10}}>💜</div>
                <div style={{fontSize:14,fontWeight:700,marginBottom:5}}>Hi! I'm FANI</div>
                <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.38)",lineHeight:1.7}}>Your AI fan assistant. Ask me anything about K-pop — concerts, merch, music, culture, photocards, fan tips and more.</div>
              </div>
              <Lbl>Quick questions</Lbl>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {QUICK.map((q,i)=>(
                  <div key={i} className="tap card" onClick={()=>{setAiInput(q);}} style={{padding:"11px 14px",cursor:"pointer",animationDelay:`${i*.05}s`}}>
                    <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.65)"}}>{q}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {aiMessages.map((msg,i)=>(
            <div key={i} className="fade" style={{marginBottom:12,display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start"}}>
              {msg.role==="assistant" && <div style={{fontSize:9,color:"rgba(255,255,255,.28)",fontFamily:"'Space Mono'",marginBottom:4}}>FANI 🤖</div>}
              <div style={{maxWidth:"85%",padding:"11px 14px",borderRadius:msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:msg.role==="user"?"linear-gradient(135deg,#7c3aed,#ec4899)":"rgba(255,255,255,.07)",border:msg.role==="assistant"?"1px solid rgba(255,255,255,.08)":"none"}}>
                <div className="sans" style={{fontSize:13,lineHeight:1.65,color:"rgba(255,255,255,.9)",whiteSpace:"pre-wrap"}}>{msg.content}</div>
              </div>
            </div>
          ))}
          {aiMode==="loading" && (
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:12,background:"linear-gradient(135deg,#7c3aed,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🤖</div>
              <div style={{display:"flex",gap:5}}>
                {[0,1,2].map(n=><div key={n} style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,.3)",animation:`pulse ${1+n*.2}s ease-in-out infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={aiEndRef}/>
        </div>

        {/* Input */}
        <div style={{flexShrink:0,padding:"12px 16px 24px",borderTop:"1px solid rgba(255,255,255,.06)",background:"rgba(6,4,14,.97)",backdropFilter:"blur(20px)"}}>
          <div style={{display:"flex",gap:9,alignItems:"flex-end"}}>
            <div style={{flex:1,borderRadius:16,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",padding:"11px 14px"}}>
              <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendAiMessage();}}} placeholder="Ask FANI anything K-pop…" rows={1} style={{width:"100%",background:"none",border:"none",color:"#f0eaff",fontSize:13,resize:"none",outline:"none",lineHeight:1.5}}/>
            </div>
            <button className="tap" onClick={sendAiMessage} disabled={!aiInput.trim()||aiMode==="loading"} style={{width:44,height:44,borderRadius:13,border:"none",background:aiInput.trim()&&aiMode!=="loading"?"linear-gradient(135deg,#7c3aed,#ec4899)":"rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",flexShrink:0}}>
              {aiMode==="loading"?<div className="spin" style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%"}}/>:"↑"}
            </button>
          </div>
          <div className="sans" style={{marginTop:7,fontSize:9,color:"rgba(255,255,255,.18)",textAlign:"center"}}>FANI is an AI — always verify critical info. Affiliate links throughout the app.</div>
        </div>
      </div>
    );
  };

  // ── FAN HUB ────────────────────────────────────────────────────────────────
  const FanTab = () => (
    <div style={{overflowY:"auto",paddingBottom:90}}>
      <div style={{padding:"52px 22px 14px"}}>
        <Lbl>Fan Tools & Resources</Lbl>
        <div className="h1" style={{fontSize:28}}>Fan Hub</div>
      </div>

      {/* Sub-nav */}
      <div style={{overflowX:"auto",display:"flex",gap:8,padding:"0 20px 18px",paddingRight:28}}>
        {[
          {id:"fanchant",label:"🎤 Fanchants"},
          {id:"merch",label:"🛍 Merch Shops"},
          {id:"budget",label:"💰 Budget Tips"},
          {id:"glossary",label:"📖 Glossary"},
          {id:"mygroups",label:"⚙️ My Groups"},
        ].map(s=>(
          <button key={s.id} className="tap pill" onClick={()=>setFanSection(s.id)} style={{flexShrink:0,background:fanSection===s.id?"rgba(255,255,255,.14)":"rgba(255,255,255,.04)",color:fanSection===s.id?"#fff":"rgba(255,255,255,.3)",border:`1px solid ${fanSection===s.id?"rgba(255,255,255,.18)":"rgba(255,255,255,.07)"}`}}>{s.label}</button>
        ))}
      </div>

      {/* FANCHANTS */}
      {fanSection==="fanchant" && (
        <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:11,paddingBottom:24}}>
          <div style={{padding:"10px 14px",borderRadius:14,background:"rgba(124,58,237,.07)",border:"1px solid rgba(124,58,237,.18)"}}>
            <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.65}}>💡 <strong style={{color:"#fff"}}>What is a fanchant?</strong> Scripted fan cheers tied to specific song moments. The whole crowd chants together — one of the most electric parts of any K-pop concert.</div>
          </div>
          {FANCHANTS.map((fc,i)=>{
            const idol = getIdol(fc.idol);
            const open = openFanchant===i;
            return (
              <div key={i} className="card fade" style={{animationDelay:`${i*.05}s`,overflow:"hidden"}}>
                <ColorBar color={idol?.color||"#7c3aed"}/>
                <div className="tap" onClick={()=>setOpenFanchant(open?null:i)} style={{padding:"13px 13px 11px",display:"flex",gap:11,alignItems:"center"}}>
                  <div style={{width:46,height:46,borderRadius:13,background:`${idol?.color||"#7c3aed"}18`,border:`1px solid ${idol?.color||"#7c3aed"}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{idol?.emoji||"🎵"}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{fc.song}</div>
                    <IdolTag idol={fc.idol}/>
                  </div>
                  <div style={{fontSize:19,color:"rgba(255,255,255,.18)",transition:"transform .3s",transform:open?"rotate(90deg)":"none"}}>›</div>
                </div>
                {open && (
                  <div className="fade" style={{padding:"0 13px 14px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
                    <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.65,marginBottom:12,marginTop:10}}>{fc.guide}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
                      {fc.lines.map((l,li)=>(
                        <div key={li} style={{borderRadius:12,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",padding:"10px 12px"}}>
                          <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.38)",marginBottom:4,fontStyle:"italic"}}>"{l.lyric}"</div>
                          <div style={{fontSize:12,fontWeight:700,color:idol?.color||"#c084fc",fontFamily:"'Space Mono'",marginBottom:3}}>{l.chant}</div>
                          <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.28)"}}>{l.note}</div>
                        </div>
                      ))}
                    </div>
                    <a href={fc.ytUrl} target="_blank" rel="noreferrer">
                      <button className="tap" style={{width:"100%",padding:"10px",borderRadius:12,border:`1px solid ${idol?.color||"#7c3aed"}28`,background:`${idol?.color||"#7c3aed"}0e`,color:idol?.color||"#c084fc",fontSize:11,cursor:"pointer",fontFamily:"'Space Mono'"}}>▶ Full Fanchant Video on YouTube</button>
                    </a>
                  </div>
                )}
                {!open && <div style={{padding:"0 13px 12px"}}><button className="tap" onClick={()=>setOpenFanchant(i)} style={{width:"100%",padding:"8px",borderRadius:12,border:`1px solid ${idol?.color||"#7c3aed"}22`,background:`${idol?.color||"#7c3aed"}08`,color:idol?.color||"#c084fc",fontSize:11,cursor:"pointer",fontFamily:"'Space Mono'"}}>See Fanchant Lines →</button></div>}
              </div>
            );
          })}
        </div>
      )}

      {/* MERCH */}
      {fanSection==="merch" && (
        <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:10,paddingBottom:24}}>
          {MERCH_SHOPS.map((s,i)=>(
            <a key={i} href={s.url} target="_blank" rel="noreferrer">
              <div className="card tap fade" style={{animationDelay:`${i*.04}s`,padding:"14px 15px"}}>
                <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{width:44,height:44,borderRadius:12,background:`${s.color}18`,border:`1px solid ${s.color}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🛍</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                      <span style={{fontSize:13,fontWeight:700}}>{s.name}</span>
                      <span style={{fontSize:9,padding:"2px 8px",borderRadius:18,background:`${s.color}18`,color:s.color,fontFamily:"'Space Mono'",fontWeight:700}}>{s.tag}</span>
                      <AffTag/>
                    </div>
                    <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.42)",lineHeight:1.55,marginBottom:5}}>{s.desc}</div>
                    <div style={{fontSize:10,fontFamily:"'Space Mono'",color:"#22c55e"}}>{s.price}</div>
                  </div>
                  <div style={{fontSize:16,color:"rgba(255,255,255,.18)"}}>↗</div>
                </div>
              </div>
            </a>
          ))}
          <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.18)",textAlign:"center",padding:"4px 0"}}>All links are affiliate links · FanDrop earns a small commission at no extra cost to you</div>
        </div>
      )}

      {/* BUDGET */}
      {fanSection==="budget" && (
        <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:10,paddingBottom:24}}>
          <div style={{padding:"10px 14px",borderRadius:14,background:"rgba(34,197,94,.07)",border:"1px solid rgba(34,197,94,.18)"}}>
            <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.65}}>💚 K-pop is expensive. Concerts, lightsticks, albums, photocards — it adds up fast. These tips from real fan communities help you participate without breaking the bank.</div>
          </div>
          {BUDGET_TIPS.map((t,i)=>(
            <div key={i} className="card fade" style={{animationDelay:`${i*.04}s`,padding:"14px 15px"}}>
              <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
                <div style={{width:40,height:40,borderRadius:11,background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{t.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>{t.tip}</div>
                  <div className="sans" style={{fontSize:11,color:"rgba(255,255,255,.45)",lineHeight:1.55,marginBottom:7}}>{t.detail}</div>
                  <div style={{fontSize:10,padding:"3px 10px",borderRadius:18,display:"inline-block",background:"rgba(34,197,94,.1)",color:"#22c55e",fontFamily:"'Space Mono'"}}>{t.save}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GLOSSARY */}
      {fanSection==="glossary" && (
        <div style={{padding:"0 20px",paddingBottom:24}}>
          <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:14,padding:"10px 14px",display:"flex",gap:9,alignItems:"center",marginBottom:14}}>
            <span style={{opacity:.4,fontSize:14}}>🔍</span>
            <input value={glossSearch} onChange={e=>setGlossSearch(e.target.value)} placeholder="Search K-pop terms…" style={{background:"none",border:"none",color:"#f0eaff",fontSize:13,flex:1,outline:"none"}}/>
          </div>
          {GLOSSARY.filter(g=>!glossSearch||g.t.toLowerCase().includes(glossSearch.toLowerCase())||g.d.toLowerCase().includes(glossSearch.toLowerCase())).map((g,i)=>(
            <div key={i} style={{padding:"11px 14px",borderRadius:13,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",marginBottom:7}}>
              <div style={{fontSize:13,fontWeight:700,color:"#c084fc",fontFamily:"'Space Mono'",marginBottom:3}}>{g.t}</div>
              <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.55}}>{g.d}</div>
            </div>
          ))}
          {GLOSSARY.filter(g=>!glossSearch||g.t.toLowerCase().includes(glossSearch.toLowerCase())||g.d.toLowerCase().includes(glossSearch.toLowerCase())).length===0 && (
            <div style={{textAlign:"center",padding:"32px 0",color:"rgba(255,255,255,.22)"}}>
              <div style={{fontSize:36,marginBottom:8}}>🔍</div>
              <div className="sans">No terms found</div>
            </div>
          )}
        </div>
      )}

      {/* MY GROUPS */}
      {fanSection==="mygroups" && (
        <div style={{padding:"0 20px",paddingBottom:24}}>
          <div className="sans" style={{fontSize:12,color:"rgba(255,255,255,.4)",lineHeight:1.7,marginBottom:16}}>Your personalised feed, drops, and fanchants are based on the groups you follow.</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {IDOLS.map(idol=>{
              const sel = myIdols.includes(idol.id);
              return (
                <div key={idol.id} className="tap" onClick={()=>{toggleIdol(idol.id);pushToast(sel?`Removed ${idol.name}`:`Added ${idol.name} 💜`);}}
                  style={{borderRadius:16,border:`1.5px solid ${sel?idol.color+"55":"rgba(255,255,255,.07)"}`,background:sel?`${idol.color}12`:"rgba(255,255,255,.03)",padding:"14px 13px",transition:"all .2s"}}>
                  <div style={{fontSize:24,marginBottom:6}}>{idol.emoji}</div>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:1}}>{idol.name}</div>
                  <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.35)",marginBottom:6}}>{idol.fandom}</div>
                  {sel && <div style={{width:"100%",height:2,borderRadius:1,background:idol.color}}/>}
                  {!sel && <div className="sans" style={{fontSize:10,color:"rgba(255,255,255,.2)"}}>Tap to follow</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{fontFamily:"'DM Sans'",background:"#06040e",minHeight:"100vh",color:"#f0eaff",display:"flex",justifyContent:"center"}}>
      <style>{css}</style>

      {/* Toast stack */}
      <div className="toast-wrap">
        {toasts.map(t=><div key={t.id} className="toast">{t.msg}</div>)}
      </div>

      <div style={{width:"100%",maxWidth:430,minHeight:"100vh",display:"flex",flexDirection:"column",position:"relative"}}>
        {/* Content */}
        <div style={{flex:1,overflow:"hidden"}}>
          {tab==="home" && <HomeTab/>}
          {tab==="events" && <EventsTab/>}
          {tab==="drops" && <DropsTab/>}
          {tab==="style" && <StyleTab/>}
          {tab==="fani" && <FaniTab/>}
          {tab==="fan" && <FanTab/>}
        </div>

        {/* Bottom nav */}
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(6,4,14,.97)",backdropFilter:"blur(28px)",borderTop:"1px solid rgba(255,255,255,.07)",padding:"8px 4px 24px",display:"flex",zIndex:300}}>
          {TABS.map(t=>{
            const active = tab===t.id;
            return (
              <button key={t.id} className="tap" onClick={()=>setTab(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0"}}>
                <div style={{fontSize:active?21:17,transition:"all .2s",filter:active?`drop-shadow(0 0 7px ${primary.color})`:"none"}}>{t.icon}</div>
                <div style={{fontSize:8,fontWeight:700,color:active?primary.color:"rgba(255,255,255,.2)",fontFamily:"'Space Mono'",letterSpacing:".04em",transition:"color .2s"}}>{t.label}</div>
                {active && <div style={{width:3,height:3,borderRadius:"50%",background:primary.color,boxShadow:`0 0 6px ${primary.color}`}}/>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
