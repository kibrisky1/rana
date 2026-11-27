function evaluateRound(s){
  for(const[pid,seq]of Object.entries(s.answers)){ if(JSON.stringify(seq)===JSON.stringify(s.seq)) s.scores[pid]++; }
  s.phase="roundEnd"; s.nextAt=Date.now()+1500; s.answers={};
}
export default {
  id:"pattern-master", name:"Pattern Master", category:"memory", description:"Ripeti il pattern di colori crescente.",
  players:{min:2,max:8}, duration:"3-6 min", supportsCompetitive:true,
  init:({players}) => { const cols=["red","blue","green","yellow"]; const scores={}; players.forEach(p=>scores[p.id]=0); return {phase:"show",round:1,seq:Array.from({length:3},()=>cols[Math.floor(Math.random()*4)]),answers:{},scores,showUntil:Date.now()+2500,deadline:0,players:players.map(p=>p.id),winnerId:null}; },
  action:(s,pid,a)=>{ if(s.phase!=="input"||s.answers[pid]) return false; s.answers[pid]=a.sequence||[]; if(Object.keys(s.answers).length===s.players.length){ evaluateRound(s); } return true; },
  tick:(s,now)=>{ let c=false; if(s.phase==="show"&&now>=s.showUntil){s.phase="input";s.deadline=now+10000;c=true;} if(s.phase==="input"&&now>=s.deadline){ evaluateRound(s); c=true; } if(s.phase==="roundEnd"&&now>=s.nextAt){ if(s.round>=5){ s.phase="complete"; const max=Math.max(...Object.values(s.scores)); const w=Object.entries(s.scores).filter(([,v])=>v===max).map(([k])=>k); s.winnerId=w.length===1?w[0]:null; } else { s.round++; s.seq=Array.from({length:2+s.round},()=>["red","blue","green","yellow"][Math.floor(Math.random()*4)]); s.answers={}; s.phase="show"; s.showUntil=now+2500; } c=true; } return c; },
  result:(s)=>{ const max=Math.max(...Object.values(s.scores)); const ranked=Object.entries(s.scores).sort(([,a],[,b])=>b-a).map(([pid],i)=>({playerId:pid,rank:i+1})); return {complete:true,winnerId:ranked[0][1]===max&&Object.values(s.scores).filter(v=>v===max).length===1?ranked[0].playerId:null,rankings:ranked}; }
};
