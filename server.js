import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8080;
const ROOT = process.cwd();
const usersFile = path.join(ROOT, 'data', 'users.json');
fs.mkdirSync(path.dirname(usersFile), {recursive:true});
if(!fs.existsSync(usersFile)) fs.writeFileSync(usersFile,'{}');
const readUsers=()=>JSON.parse(fs.readFileSync(usersFile,'utf8'));
const saveUsers=u=>fs.writeFileSync(usersFile,JSON.stringify(u,null,2));
const hash=(p,s=crypto.randomBytes(16).toString('hex'))=>({salt:s,hash:crypto.scryptSync(p,s,64).toString('hex')});
const check=(p,u)=>crypto.timingSafeEqual(Buffer.from(hash(p,u.salt).hash,'hex'),Buffer.from(u.hash,'hex'));
const sessions=new Map(); const clients=new Map(); const rooms=new Map();
const token=()=>crypto.randomBytes(24).toString('hex');
const server=http.createServer((req,res)=>{
  let p=decodeURIComponent(new URL(req.url,'http://x').pathname); if(p==='/' ) p='/index.html';
  const file=path.join(ROOT,p); if(!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('Not found');}
  const ext=path.extname(file); const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.opus':'audio/ogg'};
  res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'}); fs.createReadStream(file).pipe(res);
});
const wss=new WebSocketServer({server});
function send(ws,o){if(ws?.readyState===1)ws.send(JSON.stringify(o))}
function broadcast(o,except){for(const c of clients.values()) if(c.ws!==except)send(c.ws,o)}
function roomMembers(room){return [...(rooms.get(room)||[])].map(n=>clients.get(n)).filter(Boolean)}
function roomBroadcast(room,o,except){for(const c of roomMembers(room)) if(c.ws!==except)send(c.ws,o)}
wss.on('connection',ws=>{ let me=null; let meRoom=null; ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}
  if(m.type==='auth'){const users=readUsers(); if(m.action==='register'){if(users[m.username])return ws.send({type:'auth',ok:false,error:'Nome já usado'}); const h=hash(m.password);users[m.username]={...h,friends:[],level:1};saveUsers(users);}
    const u=users[m.username]; if(!u||!check(m.password,u))return ws.send(JSON.stringify({type:'auth',ok:false,error:'Dados inválidos'})); const t=token();sessions.set(t,m.username);me=m.username;clients.set(m.username,{ws,token:t}); ws.send(JSON.stringify({type:'auth',ok:true,token:t,username:me,level:u.level,friends:u.friends})); broadcast({type:'presence',username:me,online:true},ws); }
  else if(m.type==='friend'&&me){const users=readUsers(); if(users[m.username]&&m.username!==me){users[me].friends=Array.from(new Set([...(users[me].friends||[]),m.username]));saveUsers(users);ws.send(JSON.stringify({type:'friend',ok:true,username:m.username}));}}
  else if(m.type==='progress'&&me){const users=readUsers();users[me].level=Math.max(users[me].level||1,m.level);saveUsers(users);}
  else if(m.type==='chat'&&me)broadcast({type:'chat',from:me,text:String(m.text).slice(0,300)},null);
  else if(m.type==='room'&&me){const room=String(m.room||'').slice(0,64); if(!room)return; if(!rooms.has(room))rooms.set(room,new Set()); rooms.get(room).add(me); meRoom=room; send(ws,{type:'room',ok:true,room,members:[...rooms.get(room)]}); roomBroadcast(room,{type:'room-peer',username:me,online:true},ws);}
  else if(m.type==='leave-room'&&me){if(meRoom&&rooms.has(meRoom)){rooms.get(meRoom).delete(me);roomBroadcast(meRoom,{type:'room-peer',username:me,online:false},ws);if(!rooms.get(meRoom).size)rooms.delete(meRoom);}meRoom=null;}
  else if(m.type==='rtc'&&me){const target=clients.get(m.to); if(target?.ws.readyState===1)send(target.ws,{...m,from:me});}
}); ws.on('close',()=>{if(me){if(meRoom&&rooms.has(meRoom)){rooms.get(meRoom).delete(me);roomBroadcast(meRoom,{type:'room-peer',username:me,online:false},ws);if(!rooms.get(meRoom).size)rooms.delete(meRoom);}clients.delete(me);broadcast({type:'presence',username:me,online:false},ws)}})});
server.listen(PORT,()=>console.log(`AMG server on http://localhost:${PORT}`));
