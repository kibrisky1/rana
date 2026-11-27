import crypto from "node:crypto";
import { calculateElo } from "./elo.js";

export function createMatchmaking({profiles,rooms,gameRegistry,io}){
  const active=new Map();
  const startMatch=(room)=>{
    const game=gameRegistry.get(room.gameId);
    const players=[...room.players.values()].map(p=>({id:p.id,name:p.name}));
    const state=game.init(players, room.settings||{});
    const match={id:crypto.randomUUID(),roomId:room.id,gameId:game.id,mode:room.mode,players,state,game,finished:false};
    active.set(match.id,match); room.status="playing"; room.matchId=match.id;
    return {match, publicState:{matchId:match.id,gameId:game.id,mode:match.mode,players,state}};
  };
  const handleAction=({roomId,playerId,action})=>{
    const match=[...active.values()].find(m=>m.roomId===roomId);
    if(!match) return {error:"Nessuna partita attiva."};
    if(!match.players.some(p=>p.id===playerId)) return {error:"Non sei un partecipante."};
    const ok=match.game.action(match.state,playerId,action,Date.now());
    if(!ok) return {error:"Azione non valida."};
    if(match.state.phase==="complete"&&!match.finished){
      const summary=finish(match);
      return {state:match.state,finished:true,summary};
    }
    return {state:match.state};
  };
  const tickAll=()=>{
    const now=Date.now();
    for(const match of [...active.values()]){
      if(match.finished) continue;
      const changed=match.game.tick?match.game.tick(match.state,now):false;
      if(match.state.phase==="complete"&&!match.finished){
        const summary=finish(match);
        io.to(match.roomId).emit("match:finished",summary);
        match.finished=true; active.delete(match.id);
      } else if(changed){ io.to(match.roomId).emit("match:state",match.state); }
    }
  };
  const finish=(match)=>{
    const result=match.game.result(match.state);
    const summary={matchId:match.id,gameId:match.gameId,mode:match.mode,winnerId:result.winnerId,rankings:result.rankings,ratingChanges:{}};
    for(const p of match.players){
      const opp=match.players.find(x=>x.id!==p.id);
      const rank=result.rankings.find(r=>r.playerId===p.id)?.rank;
      const outcome=result.winnerId===p.id?"win":(rank?"loss":"draw");
      let delta=0;
      if(match.mode==="competitive"&&opp){
        const me=profiles.get(p.id),o=profiles.get(opp.id);
        delta=calculateElo({playerRating:me.gameStats[match.gameId]?.elo??me.elo,opponentRating:o.gameStats[match.gameId]?.elo??o.elo,result:outcome,opponentId:opp.id,gameId:match.gameId});
      }
      profiles.recordMatch({playerId:p.id,gameId:match.gameId,mode:match.mode,result:outcome,opponentIds:match.players.filter(x=>x.id!==p.id).map(x=>x.id),ratingDelta:delta});
      summary.ratingChanges[p.id]=delta;
    }
    return summary;
  };
  return {startMatch,handleAction,tickAll,active};
}
