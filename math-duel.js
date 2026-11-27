function genQ(){
  const ops=["+","-","*"]; const op=ops[Math.floor(Math.random()*3)];
  let a=Math.floor(Math.random()*20)+1,b=Math.floor(Math.random()*20)+1;
  if(op==="-"&&b>a)[a,b]=[b,a];
  const answer=op==="+"?a+b:op==="-"?a-b:a*b;
  return {text:`${a} ${op} ${b}`,answer};
}
export default {
  id:"math-duel", name:"Math Duel", category:"puzzle", description:"Risolvi prima le sfide matematiche.",
  players:{min:2,max:8}, duration:"3-6 min", supportsCompetitive:true,
  init:({players}) => { const q=genQ(); const scores={}; players.forEach(p=>scores[p.id]=0); return {phase:"playing",round:1,question:q.text,answer:q.answer,answers:{},scores,deadline:Date.now()+15000,players:players.map(p=>p.id),winnerId:null}; },
  action:(s,pid,a)=>{ if(s.phase!=="playing") return false; if(Number(a.value)===s.answer){ s.scores[pid]++; s.phase="roundEnd"; s.nextAt=Date.now()+1500; return true; } return false; },
  tick:(s,now)=>{ let c=false; if(s.phase==="playing"&&now>=s.deadline){ s.phase="roundEnd"; s.nextAt=now+1500; c=true; } if(s.phase==="roundEnd"&&now>=s.nextAt){ if(s.round>=5){ s.phase="complete"; const max=Math.max(...Object.values(s.scores)); const w=Object.entries(s.scores).filter(([,v])=>v===max).map(([k])=>k); s.winnerId=w.length===1?w[0]:null; } else { s.round++; const q=genQ(); s.question=q.text; s.answer=q.answer; s.answers={}; s.phase="playing"; s.deadline=now+15000; } c=true; } return c; },
  result:(s)=>{ const max=Math.max(...Object.values(s.scores)); const ranked=Object.entries(s.scores).sort(([,a],[,b])=>b-a).map(([pid],i)=>({playerId:pid,rank:i+1})); return {complete:true,winnerId:ranked[0][1]===max&&Object.values(s.scores).filter(v=>v===max).length===1?ranked[0].playerId:null,rankings:ranked}; }
};
