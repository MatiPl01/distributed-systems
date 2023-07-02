import "dotenv/config";
import { createWatchers } from "./watchers.js";
import { createClient } from "./client.js";
import logger from "./logger.js";

const client = createClient(process.env.ZOOKEEPER_HOST);

client.on("connect", () => {
  logger.log("client", "🚀 connected to zookeeper!");
  createWatchers(client);
});
