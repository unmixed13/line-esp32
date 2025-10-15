const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// เปลี่ยนเป็น IP ของ ESP32 ใน Wi-Fi บ้าน
const ESP32_IP = '192.168.1.xxx'; 

// Route สำหรับ LINE Bot POST
app.post('/command', async (req, res) => {
  try {
    // LINE ส่งข้อความมาผ่าน req.body.events
    const events = req.body.events;
    if (!events || events.length === 0) return res.sendStatus(200);

    for (let event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.toUpperCase();
        let servoAction;

        if (text === 'OPEN' || text === 'UNLOCK') {
          servoAction = 'OPEN';
        } else if (text === 'CLOSE' || text === 'LOCK') {
          servoAction = 'CLOSE';
        } else {
          continue; // ไม่ใช่คำสั่งที่รองรับ
        }

        // ส่งคำสั่งไป ESP32
        await axios.get(`http://${ESP32_IP}/servo?action=${servoAction}`);
        console.log(`Sent ${servoAction} command to ESP32`);
      }
    }

    // ตอบ LINE 200 OK
    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
