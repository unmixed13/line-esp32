const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// IP ของ ESP32 ใน Wi-Fi บ้าน
const ESP32_IP = '192.168.1.xxx';

// Webhook endpoint ต้องตรงกับ URL ที่ใส่ใน LINE Developer
app.post('/webhook', async (req, res) => {
  try {
    const events = req.body.events;
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.toLowerCase();
        console.log('Received:', text);

        let angle;
        if (text === 'open' || text === 'unlock') angle = 90;
        else if (text === 'close' || text === 'lock') angle = 0;
        else continue;

        // ส่งคำสั่งไป ESP32
        await axios.get(`http://${ESP32_IP}/servo?angle=${angle}`);
      }
    }
    res.sendStatus(200); // ต้องตอบ 200 ให้ LINE
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
