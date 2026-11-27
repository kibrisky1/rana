export default {
  id:"connect-four", name:"Connect Four", category:"strategy", description:"Metti 4 pedine in fila.",
  players:{min:2,max:2}, duration:"3-8 min", supportsCompetitive:true,
  init:({players}) => ({phase:"playing",board:Array(42).fill(null),players:players.map(p=>p.id),turn:players[0].id,winnerId:null}),
  action:(s,pid,a)=>{ if(s.phase!=="playing"||pid!==s.turn) return false; const col=a.col; if(!Number.isInteger(col)||col<0||col>6) return false; let row=-1; for(let r=5;r>=0;r--){ if(!s.board[r*7+col]){row=r;break;} } if(row<0) return false; const sym=s.players[0]===pid?"R":"Y"; s.board[row*7+col]=sym; const dirs=[[0,1],[1,0],[1,1],[1,-1]]; for(const[dr,dc]of dirs){ let n=1; for(const s2 of[1,-1]){ let r=row+dr*s2,c=col+dc*s2; while(r>=0&&r<6&&c>=0&&c<7&&s.board[r*7+c]===sym){n++;r+=dr*s2;c+=dc*s2;} } if(n>=4){s.phase="complete";s.winnerId=pid;return true;} } if(s.board.every(Boolean)) s.phase="complete"; else s.turn=s.players.find(id=>id!==pid); return true; },
  tick:()=>false,
  result:(s)=>({complete:true,winnerId:s.winnerId,rankings:s.winnerId?[{playerId:s.winnerId,rank:1}]:[]})
};
