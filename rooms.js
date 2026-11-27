import crypto from "node:crypto";
const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code=()=>Array.from({length:6},()=>A[crypto.randomInt(A.length)]).join("");

export function createRoomManager(){
  const rooms=new Map();
  const create=({hostId,hostName,gameId,mode,maxPlayers})=>{
    const room={id:crypto.randomUUID(),code:code(),hostId,gameId,mode,maxPlayers:Math.min(8,Math.max(2,maxPlayers||4)),status:"lobby",players:new Map([[hostId,{id:hostId,name:hostName,ready:true,connected:true}]]),spectators:new Map(),settings:{},createdAt:Date.now()};
    rooms.set(room.id,room); return room;
  };
  const get=id=>rooms.get(id)||null;
  const byCode=c=>[...rooms.values()].find(r=>r.code===String(c||"").toUpperCase());
  const join=(room,player)=>{
    if(room.players.has(player.id)) return room;
    if(room.players.size>=room.maxPlayers){ room.spectators.set(player.id,{id:player.id,name:player.name}); return room; }
    room.players.set(player.id,{...player,ready:false,connected:true}); return room;
  };
  const leave=(room,pid)=>{
    room.players.delete(pid); room.spectators.delete(pid);
    if(room.hostId===pid){ const n=[...room.players.keys()][0]; if(n) room.hostId=n; }
    if(room.players.size===0) rooms.delete(room.id);
    return room;
  };
  const pub=r=>({id:r.id,code:r.code,hostId:r.hostId,gameId:r.gameId,mode:r.mode,status:r.status,maxPlayers:r.maxPlayers,settings:r.settings,players:[...r.players.values()],spectators:[...r.spectators.values()]});
  return {create,get,byCode,join,leave,pub,list:()=>[...rooms.values()]};
}
