const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// =======================================
// ตัวแปร
// =======================================
const LINE_TOKEN = 'dH8P1oh9GQBtH0IJ3JBKcNe4aPzPRgTfmtjI3t2WDhe5uerlWcSCY4kyTSZYXtdr1XXqTLDKVxQmKuNbKnjQKZmzxP9LOMy+c92kMn+qvCVb9gANwsxzTAP9mrs1cmUAdDSCdDt44VID+WnImzqLKgdB04t89/1O/w1cDnyilFU='; // <<< ใส่ Token ตรงนี้
const ESP32_IP = '192.168.1.xxx'; // เปลี่ยนเป็น IP ของ ESP32
const ESP32_PORT = 80;

// =======================================
// Route สำหรับเช็ค server
// =======================================
app.get('/', (req, res) => {
  res.send('Server is running ✅');
});

// =======================================
// ฟังก์ชันตอบกลับ LINE
// =======================================
async function replyMessage(replyToken, text) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LINE_TOKEN}`,
  };

  const body = {
    replyToken: replyToken,
    messages: [{ type: 'text', text }],
  };

  try {
    await axios.post('https://api.line.me/v2/bot/message/reply', body, { headers });
    console.log('💬 Replied to LINE:', text);
  } catch (err) {
    console.error('❌ Error replying to LINE:', err.response?.data || err.message);
  }
}

// =======================================
// Route webhook สำหรับ LINE
// =======================================
app.post('/webhook', async (req, res) => {
  console.log('📩 LINE webhook received:', req.body);

  try {
    const events = req.body.events;
    if (!events) return res.sendStatus(200);

    for (let event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.toLowerCase();
        let replyText = '';
        let cmd = null;

        if (text === 'open' || text === 'unlock') {
          cmd = 'OPEN';
          replyText = '🔓 กำลังเปิดล็อก...';
        } else if (text === 'close' || text === 'lock') {
          cmd = 'CLOSE';
          replyText = '🔒 กำลังปิดล็อก...';
        } else {
          replyText = '❔ พิมพ์ open หรือ close เพื่อควบคุมกล่องพัสดุ';
        }

        // ตอบกลับใน LINE ก่อน
        await replyMessage(event.replyToken, replyText);

        // แล้วค่อยสั่ง ESP32
        if (cmd) {
          try {
            await axios.get(`http://${ESP32_IP}:${ESP32_PORT}/?cmd=${cmd}`);
            console.log(`✅ Sent command ${cmd} to ESP32`);
          } catch (err) {
            console.error('❌ Error sending command to ESP32:', err.message);
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// =======================================
// Start server
// =======================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
