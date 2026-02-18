import { UAParser } from "ua-parser-js";
import { insertRecord } from "../utils/queryFunction.js";
import axios from "axios";

export const getDeviceInfo = async (req, res) => {
  try {
    console.log(req?.user?.id,req?.user?.role)
    let ip = req.ip;
    // Remove IPv6 prefix
    if (ip.includes("::ffff:")) {
      ip = ip.replace("::ffff:", "");
    }

    // If local IP, fetch public IP instead
    if (
      ip === "127.0.0.1" ||
      ip === "localhost" ||
      ip.startsWith("192.168") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.")
    ) {
      const publicIp = await axios.get("https://api64.ipify.org?format=json");
      ip = publicIp.data.ip;
    }

    const parser = new UAParser(req.headers["user-agent"]);
    const ua = parser.getResult();

    // Use a better free API
    const geo = await axios.get(`http://ip-api.com/json/${ip}`);
    const savedData = await insertRecord("device_info", {
      ip,
      user_id: req?.user?.id || null,
      location_info: geo.data,
      browser_info: ua.browser,
      os: ua.os,
      device: ua.device.type || "desktop",
    });

    return res.json({
      data: savedData,
    });
  } catch (error) {
    console.error("Error fetching device info:", error.message);
    return res.status(500).json({ error: "Failed to fetch device info" });
  }
};
