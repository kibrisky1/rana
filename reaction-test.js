export default {
  id:"reaction-test", name:"Reaction Test", category:"reaction", description:"Clicca non appena appare il segnale.",
  players:{min:2,max:8}, duration:"1-2 min", supportsCompetitive:true,
  init:({players}) => ({phase:"waiting",signalAt:Date.now()+2000+Math.floor(Math.random()*3000),clicks:{},playerCount:players.length}),
  action:(s,pid,a,now)=>{ if(s.phase!=="signal"||s.clicks[pid]) return false; s.clicks[pid]=now; if(Object.keys(s.clicks).length===s.playerCount) s.phase="complete"; return true; },
  tick:(s,now)=>{ let c=false; if(s.phase==="waiting"&&now>=s.signalAt){s.phase="signal";s.signalTime=now;c=true;} if(s.phase==="signal"&&now>s.signalTime+5000){s.phase="complete";c=true;} return c; },
  result:(s)=>{ const ranked=Object.entries(s.clicks).sort(([,a],[,b])=>a-b).map(([pid,t],i)=>({playerId:pid,rank:i+1,reactionMs:t-s.signalTime})); return {complete:true,winnerId:ranked[0]?.playerId,rankings:ranked}; }
};
