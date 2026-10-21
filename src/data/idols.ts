export interface Idol {
  id: string; name: string; emoji: string; color: string;
  era: string; fandom: string; members: string[]; lightColor: string;
}

// The 8 featured groups. Their ids are short and stable (bts, bp, …); everything
// else resolves through the catalog in kpopGroups.ts (see lib/groups.ts).
export const IDOLS: Idol[] = [
  {id:"bts",name:"BTS",emoji:"💜",color:"#7c3aed",era:"Grand Chapter",fandom:"ARMY",members:["Jin","Suga","J-Hope","RM","Jimin","V","Jungkook"],lightColor:"#7c3aed"},
  {id:"bp",name:"BLACKPINK",emoji:"🌸",color:"#ec4899",era:"BORN PINK",fandom:"BLINK",members:["Jisoo","Jennie","Rosé","Lisa"],lightColor:"#ec4899"},
  {id:"skz",name:"Stray Kids",emoji:"⚡",color:"#f97316",era:"DOMINATE",fandom:"STAY",members:["Chan","Lee Know","Changbin","Hyunjin","Han","Felix","Seungmin","I.N"],lightColor:"#f97316"},
  {id:"aespa",name:"aespa",emoji:"❄️",color:"#a78bfa",era:"Armageddon",fandom:"MY",members:["Karina","Giselle","Winter","NingNing"],lightColor:"#a78bfa"},
  {id:"svt",name:"SEVENTEEN",emoji:"💎",color:"#34d399",era:"SPILL THE FEELS",fandom:"CARAT",members:["S.Coups","Jeonghan","Joshua","Jun","Hoshi","Wonwoo","Woozi","DK","Mingyu","The8","Seungkwan","Vernon","Dino"],lightColor:"#34d399"},
  {id:"nj",name:"NewJeans",emoji:"🐰",color:"#60a5fa",era:"How Sweet",fandom:"Bunnies",members:["Minji","Hanni","Danielle","Haerin","Hyein"],lightColor:"#60a5fa"},
  {id:"ive",name:"IVE",emoji:"🌊",color:"#fb7185",era:"WAVE",fandom:"DIVE",members:["Gaeul","Yujin","Rei","Wonyoung","Liz","Leeseo"],lightColor:"#fb7185"},
  {id:"twice",name:"TWICE",emoji:"💋",color:"#f43f5e",era:"Ready to Be",fandom:"ONCE",members:["Nayeon","Jeongyeon","Momo","Sana","Jihyo","Mina","Dahyun","Chaeyoung","Tzuyu"],lightColor:"#f43f5e"},
];
