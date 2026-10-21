import { slugify } from "../kpopGroups";

// A fanchant. Curated library entries carry structured `lines`; custom + AI-generated
// chants carry freeform `text`. `id` is stable (deterministic for library items,
// crypto.randomUUID() for user/AI ones) so the saved set survives add/remove/reorder.
export interface ChantLine { lyric: string; chant: string; note: string; }
export interface Chant {
  id: string;
  song: string;
  artist: string;
  idol: string | null;
  guide?: string;
  lines?: ChantLine[];
  text?: string;
  ytUrl?: string | null;
  aiGenerated?: boolean;
}

// Curated, browsable fanchant catalog. Stable `lib-${idol}-${slug(song)}` ids let these
// toggle in/out of the user's saved set (fandrop_chants) without collisions.
export const CHANT_LIBRARY: Chant[] = [
  {id:`lib-bts-${slugify("Dynamite")}`,song:"Dynamite",artist:"BTS",idol:"bts",guide:"During the chorus, fans shout member names in order: Jin · Suga · J-Hope · RM · Jimin · V · Jungkook on the 'da-da-da-da' break.",
    lines:[{lyric:"'Cause I, I, I'm in the stars tonight",chant:"[clap clap]",note:"Double clap on downbeat"},{lyric:"So watch me bring the fire and set the night alight",chant:"JIN! SUGA! J-HOPE! RM!",note:"One name per beat"},{lyric:"Shining through the city",chant:"JIMIN! V! JUNGKOOK!",note:"End strong"}],
    ytUrl:"https://youtube.com/results?search_query=BTS+Dynamite+fanchant+guide"},
  {id:`lib-bp-${slugify("How You Like That")}`,song:"How You Like That",artist:"BLACKPINK",idol:"bp",guide:"Shout 'BLACKPINK!' before the first beat drops. During chorus, chant 'JISOO! JENNIE! ROSÉ! LISA!' in rapid succession.",
    lines:[{lyric:"Look at you, now look at me",chant:"BLACKPINK!",note:"Shout before the drop"},{lyric:"How you like that? How you like that?",chant:"JISOO! JENNIE!",note:"Sharp, punchy"},{lyric:"How you like that?",chant:"ROSÉ! LISA!",note:"Finish the quad"}],
    ytUrl:"https://youtube.com/results?search_query=BLACKPINK+How+You+Like+That+fanchant"},
  {id:`lib-skz-${slugify("MIROH")}`,song:"MIROH",artist:"Stray Kids",idol:"skz",guide:"Fast and intense. Shout all 8 members during the rap break. Crowd goes silent on the bridge for dramatic effect.",
    lines:[{lyric:"We go! Miroh!",chant:"[stomp stomp clap]",note:"Match the stomp"},{lyric:"[rap break]",chant:"CHAN! LEE KNOW! CHANGBIN! HYUNJIN!",note:"Loud and fast"},{lyric:"[continues]",chant:"HAN! FELIX! SEUNGMIN! I.N!",note:"Equal energy"}],
    ytUrl:"https://youtube.com/results?search_query=Stray+Kids+MIROH+fanchant"},
  {id:`lib-twice-${slugify("FANCY")}`,song:"FANCY",artist:"TWICE",idol:"twice",guide:"ONCE fans chant all 9 names. The chorus chant is iconic — practice it slowly first.",
    lines:[{lyric:"I just wanna make you fancy",chant:"NAYEON! JEONGYEON! MOMO!",note:"3 names, 3 beats"},{lyric:"Make you fancy me",chant:"SANA! JIHYO! MINA!",note:"Smooth and clear"},{lyric:"Fancy you, fancy you",chant:"DAHYUN! CHAEYOUNG! TZUYU!",note:"End triumphant"}],
    ytUrl:"https://youtube.com/results?search_query=TWICE+FANCY+fanchant"},
];
