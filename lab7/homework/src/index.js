import "dotenv/config";

import logger from "./logger.js";
import { createClient } from "./client.js";
import { watchRootNode } from "./watchers.js";

const client = createClient(process.env.ZOOKEEPER_HOST);

client.on("connect", () => {
  logger.log("Client", "📶 Connected to zookeeper!");
  // Watch for changes in the root node (create/delete)
  watchRootNode(client);
});
