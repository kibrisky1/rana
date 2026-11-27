import express from "express";
import http from "node:http";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { createProfileStore } from "./profiles.js";
import { createRoomManager } from "./rooms.js";
import { createMatchmaking } from "./matchmaking.js";
import { registerSocketHandlers } from "./socket.js";
import { gameRegistry } from "./games/registry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: true }, maxHttpBufferSize: 1e6 });
app.use(express.static(path.join(__dirname, "../public")));

const profiles = createProfileStore("../database/players.json");
const rooms = createRoomManager();
const matchmaking = createMatchmaking({ profiles, rooms, gameRegistry, io });
registerSocketHandlers(io, { profiles, rooms, matchmaking, gameRegistry });

setInterval(() => matchmaking.tickAll(), 200);

httpServer.listen(PORT, "0.0.0.0", () => {
  const addrs = Object.values(os.networkInterfaces()).flat().filter(n=>n&&n.family==="IPv4"&&!n.internal).map(n=>n.address);
  console.log("\nLAN ARENA in esecuzione.");
  console.log(`Locale: http://localhost:${PORT}`);
  addrs.forEach(a=>console.log(`LAN:   http://${a}:${PORT}`));
  console.log("\nAltri dispositivi sulla stessa Wi-Fi possono aprire un indirizzo LAN qui sopra.\n");
});
