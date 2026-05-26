require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('Collab Editor Server is running ✅');
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const rooms = new Map();

wss.on('connection', (ws, req) => {
  const roomName = req.url.slice(1).split('?')[0] || 'default';

  if (!rooms.has(roomName)) rooms.set(roomName, 0);
  rooms.set(roomName, rooms.get(roomName) + 1);

  console.log(`User joined room: ${roomName} | Users in room: ${rooms.get(roomName)}`);

  setupWSConnection(ws, req, { docName: roomName });

  ws.on('close', () => {
    const count = rooms.get(roomName) - 1;
    rooms.set(roomName, count);
    console.log(`User left room: ${roomName} | Users remaining: ${count}`);
    if (count === 0) rooms.delete(roomName);
  });
});

app.get('/rooms', (req, res) => {
  res.json(Object.fromEntries(rooms));
});

const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});