export default {
  id:"quick-draw", name:"Quick Draw", category:"reaction", description:"Attendi il segnale, poi spara per primo.",
  players:{min:2,max:8}, duration:"1-2 min", supportsCompetitive:true,
  init:({players}) => ({phase:"waiting",signalAt:Date.now()+2000+Math.floor(Math.random()*4000),clicks:{},falseStarts:[],playerCount:players.length}),
  action:(s,pid,a,now)=>{ if(s.phase==="waiting"){ if(!s.falseStarts.includes(pid)) s.falseStarts.push(pid); return true; } if(s.phase==="signal"&&!s.clicks[pid]){ s.clicks[pid]=now; if(Object.keys(s.clicks).length===s.playerCount) s.phase="complete"; return true; } return false; },
  tick:(s,now)=>{ let c=false; if(s.phase==="waiting"&&now>=s.signalAt){s.phase="signal";s.signalTime=now;c=true;} if(s.phase==="signal"&&now>s.signalTime+3000){s.phase="complete";c=true;} return c; },
  result:(s)=>{ const clean=Object.entries(s.clicks).sort(([,a],[,b])=>a-b).map(([pid],i)=>({playerId:pid,rank:i+1})); const fs=s.falseStarts.filter(pid=>!s.clicks[pid]).map((pid,i)=>({playerId:pid,rank:clean.length+i+1})); const all=[...clean,...fs]; return {complete:true,winnerId:all[0]?.playerId,rankings:all}; }
};
