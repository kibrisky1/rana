export default {
  id:"speed-typing", name:"Speed Typing", category:"competitive", description:"Digita il testo accuratamente, il più veloce vince.",
  players:{min:2,max:8}, duration:"1-3 min", supportsCompetitive:true,
  init:({players}) => { const text="The quick brown fox jumps over the lazy dog while the calm river flows beneath the silver moon."; return {phase:"playing",text,progress:{},finishedAt:{},deadline:Date.now()+60000,playerCount:players.length}; },
  action:(s,pid,a,now)=>{ if(s.phase!=="playing") return false; const t=String(a.text||""); if(!s.text.startsWith(t)) return false; s.progress[pid]=t.length; if(t===s.text){ s.finishedAt[pid]=now; if(Object.keys(s.finishedAt).length===s.playerCount) s.phase="complete"; } return true; },
  tick:(s,now)=>{ if(s.phase==="playing"&&now>=s.deadline){s.phase="complete";return true;} return false; },
  result:(s)=>{ const done=Object.entries(s.finishedAt).sort(([,a],[,b])=>a-b).map(([pid],i)=>({playerId:pid,rank:i+1})); const rest=Object.keys(s.progress).filter(pid=>!s.finishedAt[pid]).sort((a,b)=>s.progress[b]-s.progress[a]).map((pid,i)=>({playerId:pid,rank:done.length+i+1})); const all=[...done,...rest]; return {complete:true,winnerId:all[0]?.playerId,rankings:all}; }
};
