import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const sanitize = v => String(v||"").replace(/[<>]/g,"").replace(/\s+/g," ").trim().slice(0,20);

export function createProfileStore(rel){
  const file = path.resolve(process.cwd(), rel);
  fs.mkdirSync(path.dirname(file), {recursive:true});
  let data = {players:{}};
  try { if(fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file,"utf8")); } catch { data={players:{}}; }
  const save = async () => { const t=file+".tmp"; await fsp.writeFile(t, JSON.stringify(data,null,2),"utf8"); await fsp.rename(t,file); };
  const get = id => data.players[id]||null;
  const create = async (nickname) => {
    const name = sanitize(nickname);
    if(name.length<2) throw new Error("Il nickname deve avere almeno 2 caratteri.");
    if(Object.values(data.players).some(p=>p.nickname.toLowerCase()===name.toLowerCase())) throw new Error("Nickname già preso.");
    const id = crypto.randomUUID();
    const profile = { id, nickname:name, avatar:"nova", skin:"default", createdAt:Date.now(), level:1, xp:0, elo:1000, highestElo:1000, gamesPlayed:0, wins:0, losses:0, draws:0, winStreak:0, achievements:[], friends:[], favorites:[], recentMatches:[], gameStats:{}, settings:{masterVolume:.8,musicVolume:.45,sfxVolume:.8,reducedMotion:false,uiScale:1} };
    data.players[id]=profile; await save(); return profile;
  };
  const update = async (id, patch) => { const p=get(id); if(!p) throw new Error("Profilo non trovato."); Object.assign(p,patch); await save(); return p; };
  const recordMatch = async ({playerId, gameId, mode, result, opponentIds, ratingDelta}) => {
    const p = get(playerId); if(!p) return;
    p.gamesPlayed++; p.xp += 25 + Math.floor(Math.random()*15);
    if(result==="win"){p.wins++;p.winStreak++;} else if(result==="loss"){p.losses++;p.winStreak=0;} else p.draws++;
    if(mode==="competitive" && Number.isFinite(ratingDelta)){ p.elo=Math.max(0,p.elo+ratingDelta); p.highestElo=Math.max(p.highestElo,p.elo); }
    p.level = 1+Math.floor(p.xp/250);
    p.recentMatches.unshift({gameId,mode,result,ratingDelta:mode==="competitive"?ratingDelta:0,opponents:opponentIds,at:Date.now()});
    p.recentMatches = p.recentMatches.slice(0,25);
    p.gameStats[gameId] ??= {played:0,wins:0,losses:0,draws:0,elo:1000};
    const s=p.gameStats[gameId]; s.played++;
    s[result==="win"?"wins":result==="loss"?"losses":"draws"]++;
    if(mode==="competitive"&&Number.isFinite(ratingDelta)) s.elo=Math.max(0,s.elo+ratingDelta);
    await save();
  };
  const pub = p => ({id:p.id,nickname:p.nickname,avatar:p.avatar,skin:p.skin,level:p.level,xp:p.xp,elo:p.elo,highestElo:p.highestElo,gamesPlayed:p.gamesPlayed,wins:p.wins,losses:p.losses,draws:p.draws,winRate:p.gamesPlayed?p.wins/p.gamesPlayed:0,achievements:p.achievements,gameStats:p.gameStats,recentMatches:p.recentMatches});
  const leaderboard = sorter => Object.values(data.players).sort(sorter).slice(0,100).map(pub);
  return { get, create, update, recordMatch, leaderboard, pub, all:()=>Object.values(data.players) };
}
