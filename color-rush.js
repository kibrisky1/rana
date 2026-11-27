export default {
  id:"color-rush", name:"Color Rush", category:"reaction", description:"Scegli il colore corretto prima degli altri.",
  players:{min:2,max:8}, duration:"1-2 min", supportsCompetitive:true,
  init:({players}) => { const cols=["red","blue","green","yellow"]; const target=cols[Math.floor(Math.random()*4)]; return {phase:"show",target,revealUntil:Date.now()+1500,answers:{},deadline:Date.now()+7500,playerCount:players.length}; },
  action:(s,pid,a,now)=>{ if(s.phase!=="playing"||s.answers[pid]) return false; s.answers[pid]={color:a.color,at:now}; if(Object.keys(s.answers).length===s.playerCount) s.phase="complete"; return true; },
  tick:(s,now)=>{ let c=false; if(s.phase==="show"&&now>=s.revealUntil){s.phase="playing";c=true;} if(s.phase==="playing"&&now>=s.deadline){s.phase="complete";c=true;} return c; },
  result:(s)=>{ const correct=Object.entries(s.answers).filter(([,v])=>v.color===s.target).sort(([,a],[,b])=>a.at-b.at).map(([pid],i)=>({playerId:pid,rank:i+1})); const wrong=Object.keys(s.answers).filter(pid=>s.answers[pid].color!==s.target).map((pid,i)=>({playerId:pid,rank:correct.length+i+1})); const all=[...correct,...wrong]; return {complete:true,winnerId:all[0]?.playerId,rankings:all}; }
};
