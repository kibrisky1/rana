export default {
  id:"number-flash", name:"Number Flash", category:"memory", description:"Memorizza il numero e riscrivilo.",
  players:{min:2,max:8}, duration:"1-2 min", supportsCompetitive:true,
  init:({players}) => { const n=String(Math.floor(Math.random()*9000)+1000); return {phase:"show",number:n,showUntil:Date.now()+2000,answers:{},deadline:Date.now()+10000,playerCount:players.length}; },
  action:(s,pid,a,now)=>{ if(s.phase!=="input"||s.answers[pid]) return false; s.answers[pid]={value:String(a.value||""),at:now}; if(Object.keys(s.answers).length===s.playerCount) s.phase="complete"; return true; },
  tick:(s,now)=>{ let c=false; if(s.phase==="show"&&now>=s.showUntil){s.phase="input";c=true;} if(s.phase==="input"&&now>=s.deadline){s.phase="complete";c=true;} return c; },
  result:(s)=>{ const correct=Object.entries(s.answers).filter(([,v])=>v.value===s.number).sort(([,a],[,b])=>a.at-b.at).map(([pid],i)=>({playerId:pid,rank:i+1})); const wrong=Object.keys(s.answers).filter(pid=>s.answers[pid].value!==s.number).map((pid,i)=>({playerId:pid,rank:correct.length+i+1})); const all=[...correct,...wrong]; return {complete:true,winnerId:all[0]?.playerId,rankings:all}; }
};
