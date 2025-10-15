const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// =======================================
// ตัวแปร ESP32 ของบิว
// =======================================
const ESP32_IP = '192.168.1.xxx'; // เปลี่ยนเป็น IP ของ ESP32 ในบ้าน
const ESP32_PORT = 80; // ถ้า ESP32 ใช้ port 80 ก็ปล่อยไว้

// =======================================
// Route สำหรับเช็ค server
// =======================================
app.get('/', (req, res) => {
  res.send('Server is running ✅');
});

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

        let cmd = null;
        if (text === 'open' || text === 'unlock') cmd = 'OPEN';
        if (text === 'close' || text === 'lock') cmd = 'CLOSE';

        if (cmd) {
          // ส่งคำสั่งไป ESP32
          try {
            await axios.get(`http://${ESP32_IP}:${ESP32_PORT}/?cmd=${cmd}`);
            console.log(`✅ Sent command ${cmd} to ESP32`);
          } catch (err) {
            console.error('❌ Error sending command to ESP32:', err.message);
          }
        }
      }
    }

    // ตอบ LINE ว่ารับ webhook แล้ว
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
