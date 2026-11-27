function checkersMoves(s,pid){
  const color=s.players[0]===pid?"r":"b";
  const caps=[],simp=[];
  for(let i=0;i<64;i++){
    const p=s.board[i]; if(!p||p.c!==color) continue;
    if(s.chain!=null&&i!==s.chain) continue;
    const r=Math.floor(i/8),c=i%8;
    const dirs=p.k?[-1,1]:[p.c==="r"?-1:1];
    for(const dr of dirs)for(const dc of[-1,1]){
      const mr=r+dr,mc=c+dc,lr=r+2*dr,lc=c+2*dc;
      if(lr<0||lr>7||lc<0||lc>7) continue;
      const mid=s.board[mr*8+mc],land=s.board[lr*8+lc];
      if(mid&&mid.c!==color&&!land) caps.push({from:i,to:lr*8+lc,capture:mr*8+mc});
      if(!mid&&!land&&!s.chain) simp.push({from:i,to:lr*8+lc});
    }
  }
  if(caps.length) return caps;
  if(s.chain!=null) return [];
  return simp;
}
export default {
  id:"checkers", name:"Checkers", category:"strategy", description:"Cattura tutti i pezzi avversari.",
  players:{min:2,max:2}, duration:"5-15 min", supportsCompetitive:true,
  init:({players}) => { const b=Array(64).fill(null); for(let r=0;r<3;r++)for(let c=0;c<8;c++) if((r+c)%2===1) b[r*8+c]={c:"b",k:false}; for(let r=5;r<8;r++)for(let c=0;c<8;c++) if((r+c)%2===1) b[r*8+c]={c:"r",k:false}; return {phase:"playing",board:b,players:players.map(p=>p.id),turn:players[0].id,winnerId:null,chain:null}; },
  action:(s,pid,a)=>{ if(s.phase!=="playing"||pid!==s.turn) return false; const {from,to}=a; if(!Number.isInteger(from)||!Number.isInteger(to)) return false; const piece=s.board[from]; if(!piece||piece.c!==(s.players[0]===pid?"r":"b")) return false; const moves=checkersMoves(s,pid); const mv=moves.find(m=>m.from===from&&m.to===to); if(!mv) return false; s.board[to]=piece; s.board[from]=null; if(mv.capture!=null) s.board[mv.capture]=null; const r=Math.floor(to/8); if(!piece.k&&((piece.c==="r"&&r===0)||(piece.c==="b"&&r===7))) piece.k=true; if(mv.capture!=null){ const more=checkersMoves(s,pid).filter(m=>m.from===to&&m.capture!=null); if(more.length){ s.chain=to; return true; } } s.chain=null; s.turn=s.players.find(id=>id!==pid); const opp=s.players.find(id=>id!==pid); const oppPieces=s.board.filter(p=>p&&p.c===(s.players[0]===opp?"r":"b")); if(oppPieces.length===0||checkersMoves(s,opp).length===0){ s.phase="complete"; s.winnerId=pid; } return true; },
  tick:()=>false,
  result:(s)=>({complete:true,winnerId:s.winnerId,rankings:s.winnerId?[{playerId:s.winnerId,rank:1}]:[]})
};
