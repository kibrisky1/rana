const K=32, COOLDOWN=10*60*1000;
const recent=new Map();
const key=(g,a,b)=>g+":"+ [a,b].sort().join(":");
export function calculateElo({playerRating,opponentRating,result,opponentId,gameId}){
  const exp=1/(1+10**((opponentRating-playerRating)/400));
  const actual=result==="win"?1:result==="loss"?0:0.5;
  let d=Math.round(K*(actual-exp));
  const k=key(gameId,playerRating,opponentId);
  const last=recent.get(k);
  if(last && Date.now()-last<COOLDOWN) d=Math.round(d*0.25);
  recent.set(k,Date.now());
  return d;
}
