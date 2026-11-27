import { renderers } from "./games.js";
const socket=io({auth:{playerId:localStorage.getItem("la.pid"),sessionToken:localStorage.getItem("la.tok")},reconnection:true});
const view=document.getElementById("view"),nav=document.getElementById("nav"),conn=document.getElementById("conn");
let profile=null,room=null,match=null,summary=null;
const el=(t,a={},...c)=>{const e=document.createElement(t);for(const[k,v]of Object.entries(a)){if(k==="onclick")e.onclick=v;else if(k==="class")e.className=v;else if(k==="style")e.style.cssText=v;else e[k]=v;}c.flat().filter(Boolean).forEach(x=>e.append(x));return e;};
const clear=n=>{while(n.firstChild)n.remove(n.firstChild);};
const beep=(f=440,d=.1)=>{try{const a=new(window.AudioContext||window.webkitAudioContext)();const o=a.createOscillator(),g=a.createGain();o.frequency.value=f;o.connect(g);g.connect(a.destination);g.gain.value=.1;o.start();o.stop(a.currentTime+d);}catch{}};

// --- Modalità "Classroom" (tasto F) ---
const decoy=document.getElementById("decoy"),decoyFrame=document.getElementById("decoy-frame");
function openDecoy(){
  const url=localStorage.getItem("la.decoy")||"https://classroom.google.com/";
  decoyFrame.src=url;
  decoy.style.display="block";
  if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{});
}
function closeDecoy(){
  decoy.style.display="none";
  decoyFrame.src="about:blank";
  if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
}
window.addEventListener("keydown",e=>{
  if(e.key.toLowerCase()==="f"&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
    e.preventDefault();
    decoy.style.display==="none"?openDecoy():closeDecoy();
  }
  if(e.key==="Escape"&&decoy.style.display!=="none") closeDecoy();
});

socket.on("connect",()=>{conn.textContent="Online";});
socket.on("disconnect",()=>{conn.textContent="Offline";});
socket.on("auth:required",()=>renderProfileCreate());
socket.on("auth:success",p=>{profile=p;renderHome();});
socket.on("room:state",r=>{room=r;if(r.status==="lobby")renderRoom();});
socket.on("lobby:list",rs=>{if(location.hash==="#multiplayer")renderMultiplayer(rs);});
socket.on("match:started",m=>{match=m;summary=null;renderGame();});
socket.on("match:state",s=>{if(match){match.state=s;renderGame();}});
socket.on("match:finished",sm=>{summary=sm;renderGame();beep(660,.3);});
socket.on("match:error",e=>alert(e.message));

function navTo(hash){location.hash=hash;render();}
window.addEventListener("hashchange",render);

function buildNav(){
  clear(nav);
  [["#home","Home"],["#library","Libreria"],["#multiplayer","Multigiocatore"],["#leaderboard","Classifiche"],["#profile","Profilo"],["#settings","Impostazioni"]].forEach(([h,l])=>nav.append(el("button",{className:location.hash===h?"active":"",onclick:()=>navTo(h)},l)));
}

function renderProfileCreate(){
  clear(view);
  const i=el("input",{placeholder:"Nickname"});
  const b=el("button",{className:"btn",onclick:()=>socket.emit("profile:create",{nickname:i.value},r=>{if(r.ok){localStorage.setItem("la.pid",r.profile.id);localStorage.setItem("la.tok",r.sessionToken);profile=r.profile;renderHome();}else alert(r.error);})},"Crea profilo");
  view.append(el("div",{className:"card",style:"max-width:420px;margin:80px auto"},el("h2",{},"Benvenuto in LAN Arena"),el("p",{},"Crea il tuo profilo per iniziare."),i,b,el("p",{style:"margin-top:12px;font-size:12px;color:#6b7280"},"Suggerimento: premi F per aprire la pagina Classroom a tutto schermo.")));
}

function renderHome(){
  buildNav();clear(view);
  view.append(el("h1",{},`Bentornato, ${profile.nickname}`));
  const stats=el("div",{className:"grid cols3"},
    el("div",{className:"card"},el("h3",{},"ELO"),el("h2",{},profile.elo)),
    el("div",{className:"card"},el("h3",{},"Livello"),el("h2",{},profile.level)),
    el("div",{className:"card"},el("h3",{},"Win Rate"),el("h2",{},Math.round(profile.winRate*100)+"%")));
  view.append(stats);
  view.append(el("div",{className:"card"},el("h3",{},"Partite recenti"),profile.recentMatches.length?profile.recentMatches.slice(0,5).map(m=>el("div",{},`${m.gameId} - ${m.result==="win"?"Vittoria":m.result==="loss"?"Sconfitta":"Pareggio"} (${m.ratingDelta>0?"+":""}${m.ratingDelta})`)).reverse():el("p",{},"Nessuna partita ancora.")));
}

function renderLibrary(){
  buildNav();clear(view);
  view.append(el("h1",{},"Libreria giochi"));
  const games=[["reaction-test","Test di Riflesso","riflessi"],["color-rush","Color Rush","riflessi"],["number-flash","Number Flash","memoria"],["fast-fingers","Dita Veloci","riflessi"],["quick-draw","Quick Draw","riflessi"],["tic-tac-toe","Tris","strategia"],["connect-four","Forza 4","strategia"],["checkers","Dama","strategia"],["battleship","Battaglia Navale","strategia"],["memory-cards","Memory","memoria"],["pattern-master","Pattern Master","memoria"],["word-scramble","Anagrammi","puzzle"],["math-duel","Duello Matematico","puzzle"],["sequence-master","Sequence Master","memoria"],["speed-typing","Velocità di Battitura","competitivo"]];
  const g=el("div",{className:"grid cols3"});
  games.forEach(([id,name,cat])=>g.append(el("div",{className:"game-card",onclick:()=>navTo("#multiplayer")},el("h3",{},name),el("span",{className:"badge"},cat),el("p",{},"Clicca per giocare"))));
  view.append(g);
}

function renderMultiplayer(rooms=[]){
  buildNav();clear(view);
  view.append(el("h1",{},"Multigiocatore"));
  const code=el("input",{placeholder:"Codice stanza"});
  const join=el("button",{className:"btn",onclick:()=>socket.emit("room:join",{code:code.value},r=>{if(r.ok){room=r.room;navTo("#room");}else alert(r.error);})},"Entra");
  const create=el("button",{className:"btn",onclick:()=>{const gameId=prompt("ID gioco (es. reaction-test):");if(!gameId)return;socket.emit("room:create",{gameId,mode:"competitive",maxPlayers:4},r=>{if(r.ok){room=r.room;navTo("#room");}else alert(r.error);});}},"Crea stanza");
  view.append(el("div",{className:"card"},el("h3",{},"Entra con codice"),code,join),el("div",{className:"card"},el("h3",{},"Crea stanza"),create));
  const list=el("div",{className:"card"},el("h3",{},"Lobby pubbliche"));
  rooms.forEach(r=>list.append(el("div",{},`${r.gameId} - ${r.code} (${r.players.length}/${r.maxPlayers})`)));
  view.append(list);
  socket.emit("lobby:list",{},r=>{if(r.ok){clear(list);r.rooms.forEach(x=>list.append(el("div",{},`${x.gameId} - ${x.code} (${x.players.length}/${x.maxPlayers})`)));}});
}

function renderRoom(){
  buildNav();clear(view);
  if(!room){navTo("#multiplayer");return;}
  view.append(el("h1",{},`Stanza ${room.code}`));
  const players=el("div",{className:"card"},el("h3",{},"Giocatori"));
  room.players.forEach(p=>players.append(el("div",{},`${p.name} ${p.ready?"[Pronto]":"[Non pronto]"} ${p.id===room.hostId?"[Host]":""}`)));
  const readyBtn=el("button",{className:"btn",onclick:()=>socket.emit("room:ready",{roomId:room.id,ready:true})},"Pronto");
  const startBtn=el("button",{className:"btn",onclick:()=>socket.emit("match:start",{roomId:room.id},r=>{if(!r.ok)alert(r.error);})},"Avvia partita");
  const leaveBtn=el("button",{className:"btn",onclick:()=>{socket.emit("room:leave",{roomId:room.id});room=null;navTo("#multiplayer");}},"Esci");
  view.append(players,el("div",{className:"card"},readyBtn,startBtn,leaveBtn));
}

function renderGame(){
  buildNav();clear(view);
  if(!match){navTo("#multiplayer");return;}
  const r=renderers[match.gameId];
  const container=el("div",{className:"card"});
  view.append(el("h1",{},match.gameId),container);
  if(summary){
    container.append(el("h3",{},summary.winnerId===profile.id?"Vittoria!":"Partita conclusa"));
    Object.entries(summary.ratingChanges).forEach(([pid,d])=>container.append(el("p",{},`${pid===profile.id?"Tu":"Giocatore"}: ${d>0?"+":""}${d} ELO`)));
    const again=el("button",{className:"btn",onclick:()=>{summary=null;match=null;navTo("#room");}},"Torna alla stanza");
    container.append(again);
  } else if(r){ r(container,match.state,profile.id,a=>socket.emit("match:action",{roomId:room.id,action:a}),match.players.map(p=>p.id)); }
}

function renderLeaderboard(){
  buildNav();clear(view);
  view.append(el("h1",{},"Classifiche"));
  const list=el("div",{className:"card"},el("h3",{},"ELO globale"));
  socket.emit("leaderboard",{},r=>{if(r.ok){clear(list);r.players.forEach((p,i)=>list.append(el("div",{},`#${i+1} ${p.nickname} - ${p.elo} ELO (${p.wins}V)`)));}});
  view.append(list);
}

function renderProfile(){
  buildNav();clear(view);
  view.append(el("h1",{},"Profilo"));
  view.append(el("div",{className:"card"},el("h3",{},profile.nickname),el("p",{},`Livello ${profile.level} | ${profile.elo} ELO | ${profile.wins}V ${profile.losses}S`)));
  const nick=el("input",{value:profile.nickname});
  const save=el("button",{className:"btn",onclick:()=>socket.emit("profile:update",{nickname:nick.value},r=>{if(r.ok){profile=r.profile;renderProfile();}else alert(r.error);})},"Salva");
  view.append(el("div",{className:"card"},el("h3",{},"Nickname"),nick,save));
}

function renderSettings(){
  buildNav();clear(view);
  view.append(el("h1",{},"Impostazioni"));
  const master=el("input",{type:"range",min:0,max:1,step:.1,value:localStorage.getItem("la.vol")||.8});
  master.oninput=()=>localStorage.setItem("la.vol",master.value);
  const decoyUrl=el("input",{value:localStorage.getItem("la.decoy")||"https://classroom.google.com/",placeholder:"URL pagina Classroom"});
  const saveDecoy=el("button",{className:"btn",onclick:()=>{localStorage.setItem("la.decoy",decoyUrl.value);alert("URL Classroom salvato.");}},"Salva URL");
  view.append(el("div",{className:"card"},el("h3",{},"Volume generale"),master));
  view.append(el("div",{className:"card"},el("h3",{},"Pagina Classroom (tasto F)"),el("p",{},"Premi F in qualsiasi momento per aprire questa pagina a tutto schermo. Premi F di nuovo o Esc per uscire."),decoyUrl,saveDecoy));
}

function render(){
  const h=location.hash||"#home";
  if(!profile){renderProfileCreate();return;}
  if(h==="#home")renderHome();
  else if(h==="#library")renderLibrary();
  else if(h==="#multiplayer")renderMultiplayer();
  else if(h==="#room")renderRoom();
  else if(h==="#leaderboard")renderLeaderboard();
  else if(h==="#profile")renderProfile();
  else if(h==="#settings")renderSettings();
  else renderHome();
}
render();
