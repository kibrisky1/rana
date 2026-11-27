export default {
  id:"tic-tac-toe", name:"Tic-Tac-Toe", category:"strategy", description:"Duello classico 3x3.",
  players:{min:2,max:2}, duration:"2-5 min", supportsCompetitive:true,
  init:({players}) => ({phase:"playing",board:Array(9).fill(null),players:players.map(p=>p.id),turn:players[0].id,winnerId:null,winningLine:null}),
  action:(s,pid,a)=>{ if(s.phase!=="playing"||pid!==s.turn) return false; const c=a.cell; if(!Number.isInteger(c)||c<0||c>8||s.board[c]) return false; const sym=s.players[0]===pid?"X":"O"; s.board[c]=sym; const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; const line=L.find(x=>x.every(i=>s.board[i]===sym)); if(line){s.phase="complete";s.winnerId=pid;s.winningLine=line;return true;} if(s.board.every(Boolean)) s.phase="complete"; else s.turn=s.players.find(id=>id!==pid); return true; },
  tick:()=>false,
  result:(s)=>({complete:true,winnerId:s.winnerId,rankings:s.winnerId?[{playerId:s.winnerId,rank:1}]:[]})
};
