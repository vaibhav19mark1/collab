import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env") });

import "./socket";

console.log("Socket.io server initialized");
