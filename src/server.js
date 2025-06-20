require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const cors = require('cors');

const SIGNAL_PORT = process.env.SIGNAL_PORT || 3001;
const HTTP_PORT = process.env.HTTP_PORT || 3000;

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// HTTP Server
const server = http.createServer(app);

// WebSocket Signaling server for WebRTC
const wss = new WebSocket.Server({ server });

let peers = {};

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    let message;
    try {
      message = JSON.parse(msg);
    } catch {
      return;
    }
    // Simple signaling relay (to be expanded)
    if (message.to && peers[message.to]) {
      peers[message.to].send(msg);
    } else if (message.type === 'register') {
      peers[message.id] = ws;
      ws.id = message.id;
    }
  });

  ws.on('close', () => {
    if (ws.id) delete peers[ws.id];
  });
});

server.listen(HTTP_PORT, () => {
  console.log(`HTTP server running at http://localhost:${HTTP_PORT}`);
  console.log(`WebSocket signaling running at ws://localhost:${HTTP_PORT}`);
});
