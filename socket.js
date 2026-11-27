import crypto from "node:crypto";
const sessions=new Map();
const emitRoom=(io,room)=>io.to(room.id).emit("room:state",room);
const lobby=(io,rooms)=>io.emit("lobby:list",rooms.list().map(rooms.pub));

export function registerSocketHandlers(io,ctx){
  const {profiles,rooms,matchmaking,gameRegistry}=ctx;
  io.on("connection",(socket)=>{
    let playerId=socket.handshake.auth?.playerId;
    let token=socket.handshake.auth?.sessionToken;
    let profile=playerId?profiles.get(playerId):null;
    if(profile){ sessions.set(token,{playerId,socketId:socket.id}); socket.emit("auth:success",profiles.pub(profile)); }
    else socket.emit("auth:required");

    socket.on("profile:create",async({nickname},cb)=>{
      try{ profile=await profiles.create(nickname); playerId=profile.id; token=crypto.randomUUID(); sessions.set(token,{playerId,socketId:socket.id}); cb({ok:true,profile:profiles.pub(profile),sessionToken:token}); }
      catch(e){ cb({ok:false,error:e.message}); }
    });
    socket.on("profile:update",async(patch,cb)=>{
      try{ if(!profile) throw new Error("Nessun profilo."); if(patch.nickname) patch.nickname=String(patch.nickname).replace(/[<>]/g,"").trim().slice(0,20); profile=await profiles.update(playerId,patch); cb({ok:true,profile:profiles.pub(profile)}); }
      catch(e){ cb({ok:false,error:e.message}); }
    });
    socket.on("lobby:list",(_,cb)=>cb({ok:true,rooms:rooms.list().map(rooms.pub)}));
    socket.on("leaderboard",({gameId},cb)=>{
      const sorter = gameId ? (a,b)=>(b.gameStats[gameId]?.elo||0)-(a.gameStats[gameId]?.elo||0) : (a,b)=>b.elo-a.elo;
      cb({ok:true,players:profiles.leaderboard(sorter)});
    });
    socket.on("room:create",({gameId,mode,maxPlayers},cb)=>{
      try{
        if(!profile) throw new Error("Crea prima un profilo.");
        const game=gameRegistry.get(gameId); if(!game) throw new Error("Gioco sconosciuto.");
        const room=rooms.create({hostId:playerId,hostName:profile.nickname,gameId,mode,maxPlayers:Math.min(game.players.max,maxPlayers||game.players.max)});
        socket.join(room.id); cb({ok:true,room:rooms.pub(room)}); lobby(io,rooms);
      }catch(e){ cb({ok:false,error:e.message}); }
    });
    socket.on("room:join",({code},cb)=>{
      try{
        if(!profile) throw new Error("Crea prima un profilo.");
        const room=rooms.byCode(code); if(!room) throw new Error("Stanza non trovata.");
        rooms.join(room,{id:playerId,name:profile.nickname}); socket.join(room.id); emitRoom(io,room); cb({ok:true,room:rooms.pub(room)});
      }catch(e){ cb({ok:false,error:e.message}); }
    });
    socket.on("room:leave",({roomId})=>{
      const room=rooms.get(roomId); if(!room) return;
      rooms.leave(room,playerId); socket.leave(roomId); emitRoom(io,room); lobby(io,rooms);
    });
    socket.on("room:ready",({roomId,ready})=>{
      const room=rooms.get(roomId); const p=room?.players.get(playerId); if(!room||!p) return;
      p.ready=Boolean(ready); emitRoom(io,room);
    });
    socket.on("match:start",({roomId},cb)=>{
      try{
        const room=rooms.get(roomId); if(!room||room.hostId!==playerId) throw new Error("Solo l'host può avviare.");
        if(![...room.players.values()].every(p=>p.ready)) throw new Error("Tutti i giocatori devono essere pronti.");
        const {publicState}=matchmaking.startMatch(room);
        io.to(roomId).emit("match:started",publicState);
        cb({ok:true});
      }catch(e){ cb({ok:false,error:e.message}); }
    });
    socket.on("match:action",({roomId,action})=>{
      const r=matchmaking.handleAction({roomId,playerId,action});
      if(r?.error) socket.emit("match:error",{message:r.error});
      if(r?.state) io.to(roomId).emit("match:state",r.state);
      if(r?.finished) io.to(roomId).emit("match:finished",r.summary);
    });
    socket.on("disconnect",()=>{
      for(const room of rooms.list()){
        const p=room.players.get(playerId);
        if(p){ p.connected=false; emitRoom(io,room); }
      }
    });
  });
}
