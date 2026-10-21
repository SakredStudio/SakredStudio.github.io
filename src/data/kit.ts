export interface KitItem { t: string; aff: boolean; url: string; tag: string; }
export interface KitPhase { phase: string; color: string; icon: string; items: KitItem[]; }

export const CONCERT_KIT: KitPhase[] = [
  {phase:"30 Days Before",color:"#a78bfa",icon:"📅",items:[
    {t:"Secure your ticket",aff:true,url:"https://seatgeek.com",tag:"SeatGeek"},
    {t:"Order official lightstick (2-3 wk shipping from Korea)",aff:true,url:"https://weverse.io",tag:"Weverse"},
    {t:"Join official fan club for presale access next time",aff:false,url:"",tag:""},
    {t:"Start planning your concert outfit",aff:false,url:"",tag:""},
  ]},
  {phase:"14 Days Before",color:"#f97316",icon:"👗",items:[
    {t:"Order outfit pieces",aff:true,url:"https://yesstyle.com",tag:"YesStyle"},
    {t:"Learn fanchants for top 3 songs",aff:false,url:"",tag:""},
    {t:"Download Weverse — artists post updates here",aff:false,url:"",tag:""},
    {t:"Check venue bag policy (clear bags usually required)",aff:false,url:"",tag:""},
  ]},
  {phase:"3 Days Before",color:"#22d3ee",icon:"✅",items:[
    {t:"Practise fanchants one final time",aff:false,url:"",tag:""},
    {t:"Screenshot your ticket QR — no signal at venue",aff:false,url:"",tag:""},
    {t:"Prepare fan banner or slogan if making one",aff:false,url:"",tag:""},
    {t:"Check weather, plan layers",aff:false,url:"",tag:""},
  ]},
  {phase:"Day Of Concert",color:"#22c55e",icon:"🎤",items:[
    {t:"Arrive 90 min early for lightstick Bluetooth sync",aff:false,url:"",tag:""},
    {t:"Grab fan-made slogans outside venue (usually free!)",aff:false,url:"",tag:""},
    {t:"Check Weverse for last-minute artist posts",aff:false,url:"",tag:""},
    {t:"Charge phone to 100% — it's your backup lightstick",aff:false,url:"",tag:""},
  ]},
];
