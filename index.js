const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// ====== CONFIG ======
const ESP32_IP = "192.168.1.100"; // <-- เปลี่ยนเป็น IP ของ ESP32 ใน Wi-Fi บ้าน
const ESP32_PORT = 80;            // พอร์ต Web Server ESP32

// ====== LINE Webhook ======
app.post("/line-webhook", async (req, res) => {
  try {
    const events = req.body.events;
    if (!events || events.length === 0) return res.sendStatus(200);

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const msg = event.message.text.toUpperCase();
        console.log("📩 Message from LINE:", msg);

        let action = "";
        if (msg.includes("OPEN") || msg.includes("UNLOCK")) action = "OPEN";
        else if (msg.includes("CLOSE") || msg.includes("LOCK")) action = "CLOSE";

        if (action) {
          const espUrl = `http://${ESP32_IP}:${ESP32_PORT}/command?action=${action}`;
          console.log("➡️ Sending to ESP32:", espUrl);

          try {
            await axios.get(espUrl);
            console.log("✅ Sent successfully");
          } catch (err) {
            console.error("❌ Error sending to ESP32:", err.message);
          }
        } else {
          console.log("⚠️ Unknown command from LINE:", msg);
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.sendStatus(500);
  }
});

// ====== Test Route ======
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// ====== START SERVER ======
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
 
